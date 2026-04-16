"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  return (
    <a href="/api/auth/signout">
      <Button variant="danger" className="w-full gap-2">
        <LogOut className="w-4 h-4" />
        התנתק
      </Button>
    </a>
  );
}
