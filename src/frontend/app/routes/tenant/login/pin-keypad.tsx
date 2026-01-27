"use client";

import { Delete } from "lucide-react";
import { Button } from "@/frontend/app/ui/button";
import { cn } from "@/frontend/app/ui/utils";

interface PinKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onComplete: (value: string) => void;
  error: string | null;
  disabled: boolean;
  maxLength: number;
}

export function PinKeypad({
  value,
  onChange,
  onComplete,
  error,
  disabled,
  maxLength,
}: PinKeypadProps) {
  const handleDigit = (digit: string) => {
    if (value.length >= maxLength) return;
    const next = value + digit;
    onChange(next);
    if (next.length === maxLength) {
      onComplete(next);
    }
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  const handleClear = () => {
    onChange("");
  };

  const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", ""];

  return (
    <div className="space-y-4">
      {/* PIN Display */}
      <div className="flex justify-center gap-2">
        {Array.from({ length: maxLength }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-3 h-3 rounded-full transition-colors",
              i < value.length ? "bg-primary" : "bg-gray-200",
            )}
          />
        ))}
      </div>

      <p className="text-red-500 text-center text-sm h-5">
        {error ?? "\u00A0"}
      </p>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
        {digits.map((digit, i) => {
          if (digit === "") {
            if (i === 9) {
              // Clear button
              return (
                <Button
                  key="clear"
                  variant="ghost"
                  className="h-14 text-sm"
                  onClick={handleClear}
                  disabled={disabled || value.length === 0}
                >
                  Clear
                </Button>
              );
            } else {
              // Delete button
              return (
                <Button
                  key="delete"
                  variant="ghost"
                  className="h-14"
                  onClick={handleDelete}
                  disabled={disabled || value.length === 0}
                >
                  <Delete className="h-5 w-5" />
                </Button>
              );
            }
          }

          return (
            <Button
              key={digit}
              variant="outline"
              className="h-14 text-xl font-medium"
              onClick={() => handleDigit(digit)}
              disabled={disabled}
            >
              {digit}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
