"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLogout}
      className="text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent p-1 text-xs"
    >
      <LogOut className="mr-1 h-3 w-3" />
      Logout
    </Button>
  );
}
