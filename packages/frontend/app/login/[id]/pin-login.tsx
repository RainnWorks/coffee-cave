"use client";

import { useState } from "react";
import { PinKeypad } from "./pin-keypad";
import { API_URL } from "@/lib/manifest/client";
import { Staff } from "../page";
import { useRouter } from "next/navigation";

export const PinLogin = ({ staffMember }: { staffMember: Staff }) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const { replace } = useRouter();
  const handlePinChange = (newPin: string) => {
    setPin(newPin);
    setError("");
  };

  const handleLogin = async () => {
    if (pin.length !== 4) {
      setError("PIN must be 4 digits");
      return;
    }

    setIsLoading(true);

    const result = await fetch(`${API_URL}/api/staff/login`, {
      method: "POST",
      body: JSON.stringify({
        username: staffMember.username,
        pin,
      }),
    });
    const data = await result.json();
    if (data.success === true) {
      replace("/");
    } else {
      setError("Incorrect PIN. Please try again.");
      setPin("");
      setIsLoading(false);
    }
  };
  return (
    <PinKeypad
      pin={pin}
      onChange={handlePinChange}
      onSubmit={handleLogin}
      error={error}
      isLoading={isLoading}
    />
  );
};
