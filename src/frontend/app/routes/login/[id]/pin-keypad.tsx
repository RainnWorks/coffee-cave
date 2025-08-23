"use client";

import { useState, useEffect } from "react";
import { Button } from "../../../components/ui/button";
import { Loader2, Delete } from "lucide-react";

interface PinKeypadProps {
  pin: string;
  onChange: (pin: string) => void;
  onSubmit: () => void;
  error: string;
  isLoading: boolean;
}

export function PinKeypad({
  pin,
  onChange,
  onSubmit,
  error,
  isLoading,
}: PinKeypadProps) {
  const [maskedPin, setMaskedPin] = useState<string>("");

  useEffect(() => {
    setMaskedPin("•".repeat(pin.length));
  }, [pin]);

  const handleKeyPress = (digit: string) => {
    if (pin.length < 4) {
      onChange(pin + digit);
    }
  };

  const handleDelete = () => {
    onChange(pin.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => {
        onSubmit();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [pin, onSubmit]);

  return (
    <div className="space-y-6">
      <div className="relative">
        <div
          className={`text-center p-3 border-2 rounded-md text-2xl tracking-widest h-14 flex items-center justify-center ${
            error ? "border-red-500" : "border-gray-300"
          }`}
          aria-live="polite"
          aria-label={`PIN entry, ${pin.length} digits entered`}
        >
          {maskedPin || (
            <span className="text-gray-400">Enter 4-digit PIN</span>
          )}
        </div>
        {error && (
          <p className="text-red-500 text-sm mt-1" aria-live="assertive">
            {error}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <Button
            key={digit}
            type="button"
            variant="outline"
            className="h-14 text-xl font-semibold"
            onClick={() => handleKeyPress(digit.toString())}
            disabled={pin.length >= 4 || isLoading}
          >
            {digit}
          </Button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold"
          onClick={handleClear}
          disabled={pin.length === 0 || isLoading}
        >
          C
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl font-semibold"
          onClick={() => handleKeyPress("0")}
          disabled={pin.length >= 4 || isLoading}
        >
          0
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-14 text-xl"
          onClick={handleDelete}
          disabled={pin.length === 0 || isLoading}
          aria-label="Delete last digit"
        >
          <Delete className="h-5 w-5" />
        </Button>
      </div>

      <Button type="button" className="w-full h-14 text-lg" onClick={onSubmit}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Verifying...
          </>
        ) : (
          "Login"
        )}
      </Button>
    </div>
  );
}
