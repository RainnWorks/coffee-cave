"use client";

import { useState } from "react";
import { PinKeypad } from "./pin-keypad";
import type { Staff } from "../../../../../schema";
import { useAuth } from "../../../AuthedZeroProvider";
import { useLocation } from "wouter";

export const PinLogin = ({ staffMember }: { staffMember: Staff }) => {
  const { loginStaff } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [pin, setPin] = useState<string>("");
  const [, setLocation] = useLocation();
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
      const result = await loginStaff(staffMember.id, pin);
      if (result.success) {
        setLocation("/");
      } else {
        setError(result.error);
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
