import { EnHeader } from "@/components/layout/EnHeader";
import { EnFooter } from "@/components/layout/EnFooter";

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" dir="ltr" className="min-h-screen flex flex-col bg-paper-soft text-left">
      <EnHeader />
      <main className="flex-1">{children}</main>
      <EnFooter />
    </div>
  );
}
