"use client";

import { useZeroAuth } from "@frontend/zero";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function LogoutPage() {
  const { logout } = useZeroAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    logout(true).then(() => {
      setLocation("/");
    });
  }, [logout, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-muted-foreground">Logging out...</p>
    </div>
  );
}
