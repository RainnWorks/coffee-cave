"use client";

import { useState } from "react";
import { PinKeypad } from "./pin-keypad";
import { useRouter } from "next/navigation";
import { Staff } from "@/lib/manifest/types";
import { login } from "./actions/login";

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

    try {
      const result = await login(staffMember.username, pin);
      if (result.success) {
        replace("/");
      } else {
        setError("Incorrect PIN. Please try again.");
        setPin("");
        setIsLoading(false);
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred during login");
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
