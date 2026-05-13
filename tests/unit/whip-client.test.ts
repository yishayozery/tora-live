import { describe, it, expect, vi, beforeEach } from "vitest";
import { createWhipPublisher } from "@/lib/whipClient";

// === Mocks ===
class MockPC {
  iceGatheringState: RTCIceGatheringState = "complete"; // לדלג על המתנה ל-ICE
  connectionState: RTCPeerConnectionState = "new";
  localDescription: { type: "offer"; sdp: string } | null = null;
  private listeners: Record<string, Array<() => void>> = {};
  closed = false;
  added: Array<{ kind: string; direction: string }> = [];

  constructor(public config: RTCConfiguration) {}

  addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit) {
    this.added.push({ kind: track.kind, direction: init.direction || "" });
  }
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: "offer", sdp: "v=0\r\no=mock 0 0 IN IP4 127.0.0.1\r\n" };
  }
  async setLocalDescription(d: RTCSessionDescriptionInit) {
    this.localDescription = { type: "offer", sdp: d.sdp || "v=0\r\n" };
  }
  async setRemoteDescription(_d: RTCSessionDescriptionInit) {
    // הדמיית חיבור מוצלח
    this.connectionState = "connected";
    this.fire("connectionstatechange");
  }
  addEventListener(name: string, fn: () => void) {
    (this.listeners[name] ||= []).push(fn);
  }
  removeEventListener(name: string, fn: () => void) {
    this.listeners[name] = (this.listeners[name] || []).filter((f) => f !== fn);
  }
  close() { this.closed = true; this.connectionState = "closed"; this.fire("connectionstatechange"); }

  fire(name: string) { (this.listeners[name] || []).forEach((fn) => fn()); }
}

function fakeStream(): MediaStream {
  // קבוצת tracks מינימלית — מספיק שיהיה getTracks().
  const tracks: any[] = [
    { kind: "video", readyState: "live", enabled: true, stop() {} },
    { kind: "audio", readyState: "live", enabled: true, stop() {} },
  ];
  return { getTracks: () => tracks, getVideoTracks: () => tracks.filter((t) => t.kind === "video"), getAudioTracks: () => tracks.filter((t) => t.kind === "audio") } as any;
}

function okFetch(answer = "v=0\r\no=server 0 0 IN IP4 1.1.1.1\r\n"): typeof fetch {
  return vi.fn(async (_url: any, _init?: any) => {
    return new Response(answer, {
      status: 201,
      headers: { "Location": "https://customer.cloudflarestream.com/resource/abc123" },
    });
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createWhipPublisher", () => {
  it("rejects without whipUrl", async () => {
    await expect(
      createWhipPublisher({
        whipUrl: "",
        stream: fakeStream(),
        rtcImpl: MockPC as any,
        fetchImpl: okFetch(),
      })
    ).rejects.toThrow("חסר WHIP URL");
  });

  it("creates offer, POSTs SDP, parses answer, transitions to connected", async () => {
    const states: string[] = [];
    const fetchSpy = okFetch();
    const publisher = await createWhipPublisher({
      whipUrl: "https://customer.cloudflarestream.com/whip",
      stream: fakeStream(),
      rtcImpl: MockPC as any,
      fetchImpl: fetchSpy,
      onStateChange: (s) => states.push(s),
    });

    expect(states).toContain("connected");
    expect(publisher.state).toBe("connected");
    expect((fetchSpy as any).mock.calls).toHaveLength(1);
    const [, init] = (fetchSpy as any).mock.calls[0];
    expect(init.method).toBe("POST");
    expect((init.headers as any)["Content-Type"]).toBe("application/sdp");
    // ה-body צריך להיות SDP
    expect(init.body).toContain("v=0");
  });

  it("adds a sendonly transceiver per track", async () => {
    const added: any[] = [];
    class TrackingPC extends MockPC {
      addTransceiver(track: MediaStreamTrack, init: RTCRtpTransceiverInit) {
        added.push({ kind: track.kind, direction: init.direction });
      }
    }
    await createWhipPublisher({
      whipUrl: "https://x/whip",
      stream: fakeStream(),
      rtcImpl: TrackingPC as any,
      fetchImpl: okFetch(),
    });
    expect(added).toHaveLength(2);
    expect(added.every((a) => a.direction === "sendonly")).toBe(true);
  });

  it("fails on non-2xx WHIP response", async () => {
    const onError = vi.fn();
    const failingFetch = vi.fn(async () =>
      new Response("nope", { status: 401 }),
    ) as unknown as typeof fetch;

    await expect(
      createWhipPublisher({
        whipUrl: "https://x/whip",
        stream: fakeStream(),
        rtcImpl: MockPC as any,
        fetchImpl: failingFetch,
        onError,
      })
    ).rejects.toThrow(/401/);

    expect(onError).toHaveBeenCalledOnce();
  });

  it("stop() sends DELETE to the resource URL and closes PC", async () => {
    const fetchSpy = vi.fn(async (url: any, init?: any) => {
      if (init?.method === "DELETE") return new Response(null, { status: 200 });
      return new Response("v=0\r\n", {
        status: 201,
        headers: { Location: "https://customer.cloudflarestream.com/resource/abc" },
      });
    }) as unknown as typeof fetch;

    const publisher = await createWhipPublisher({
      whipUrl: "https://customer.cloudflarestream.com/whip/xyz",
      stream: fakeStream(),
      rtcImpl: MockPC as any,
      fetchImpl: fetchSpy,
    });

    await publisher.stop();
    const deleteCalls = (fetchSpy as any).mock.calls.filter((c: any[]) => c[1]?.method === "DELETE");
    expect(deleteCalls).toHaveLength(1);
    expect(publisher.state).toBe("closed");
  });

  it("stop() is idempotent", async () => {
    const fetchSpy = vi.fn(async () =>
      new Response("v=0\r\n", { status: 201, headers: { Location: "https://x/r" } }),
    ) as unknown as typeof fetch;

    const publisher = await createWhipPublisher({
      whipUrl: "https://x/whip",
      stream: fakeStream(),
      rtcImpl: MockPC as any,
      fetchImpl: fetchSpy,
    });
    await publisher.stop();
    await publisher.stop(); // second call must not throw
    // Only one DELETE
    const deletes = (fetchSpy as any).mock.calls.filter((c: any[]) => c[1]?.method === "DELETE");
    expect(deletes).toHaveLength(1);
  });

  it("handles WHIP server with relative Location header", async () => {
    const fetchSpy = vi.fn(async (_url: any, init?: any) => {
      if (init?.method === "DELETE") {
        // make sure URL is absolute
        expect(String(_url)).toMatch(/^https:\/\//);
        return new Response(null, { status: 200 });
      }
      return new Response("v=0\r\n", {
        status: 201,
        headers: { Location: "/resources/abc" }, // RELATIVE
      });
    }) as unknown as typeof fetch;

    const publisher = await createWhipPublisher({
      whipUrl: "https://customer.cloudflarestream.com/whip/xyz",
      stream: fakeStream(),
      rtcImpl: MockPC as any,
      fetchImpl: fetchSpy,
    });
    await publisher.stop();
  });

  it("does not stop tracks (caller's responsibility)", async () => {
    const s = fakeStream();
    const stopSpy = vi.fn();
    s.getTracks().forEach((t: any) => { t.stop = stopSpy; });
    const publisher = await createWhipPublisher({
      whipUrl: "https://x/whip",
      stream: s,
      rtcImpl: MockPC as any,
      fetchImpl: okFetch(),
    });
    await publisher.stop();
    expect(stopSpy).not.toHaveBeenCalled();
  });
});
