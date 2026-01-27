"use client";

import {
  SkipBackIcon as BackspaceIcon,
  Edit as EditIcon,
  X,
} from "lucide-react";
import { type JSX, useCallback, useMemo, useRef, useState } from "react";
import { Button } from "./button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { cn } from "./utils";

/** Keys the on‑screen keyboard can emit. */
type Key =
  | "0"
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "."
  | "backspace"
  | "clear";

export interface PosInputProps {
  value: string;
  onChange: (value: string) => void;
  onChangeNumeric?: (value: number) => void;
  formatter?: Intl.NumberFormat;
  maxValue?: number;
  keyboardType?: "modal" | "inline";
  className?: string;
  buttonClassName?: string;
  displayClassName?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

/**
 * A point‑of‑sale numeric input with an on‑screen keyboard that keeps
 * formatting and placeholder behaviour even while the user is typing.
 */
export function PosInput({
  value,
  onChange,
  onChangeNumeric,
  formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }),
  maxValue,
  keyboardType = "inline",
  className,
  buttonClassName,
  displayClassName,
  placeholder = "0",
  label = "Amount",
  disabled = false,
}: PosInputProps): JSX.Element {
  /* ------------------------------------------------------------------- */
  /*                              Helpers                                */
  /* ------------------------------------------------------------------- */

  /** Remove all chars except digits + dot. */
  const getRawValue = (val: string): string => val.replace(/[^\d.]/g, "");

  const opts = formatter.resolvedOptions();

  /** Locale decimal separator (default to "." for latn). */
  const decimalSeparator = useMemo(() => {
    return opts.numberingSystem === "latn"
      ? "."
      : formatter.format(1.1).charAt(1);
  }, [formatter, opts]);

  const maxFractionDigits = opts.maximumFractionDigits ?? 0;
  const allowDecimals = maxFractionDigits > 0;

  /** Formatter that prints *only* the integer part (no decimals). */
  const integerFormatter = useMemo(
    () =>
      new Intl.NumberFormat(opts.locale, {
        style: "currency",
        currency: opts.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [opts],
  );

  /**
   * Format the user‑typed value but *preserve* exactly what they entered
   * after the decimal point – including trailing zeros and an empty string
   * (when the user has just typed the dot).
   */
  const formatValue = useCallback(
    (val: string): string => {
      if (!val) return "";

      const raw = getRawValue(val);
      if (!raw.includes(".")) {
        // Pure integer input.
        return integerFormatter.format(Number(raw));
      }

      const [intPart, fracPart = ""] = raw.split(".");
      const intFormatted = integerFormatter.format(Number(intPart || "0"));
      return `${intFormatted}${decimalSeparator}${fracPart}`;
    },
    [integerFormatter, decimalSeparator],
  );

  /* ------------------------------------------------------------------- */
  /*                               State                                 */
  /* ------------------------------------------------------------------- */

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------- */
  /*                           Derived values                            */
  /* ------------------------------------------------------------------- */

  const rawValue = useMemo(() => getRawValue(value), [value]);
  const isDecimalMode = rawValue.includes(".");
  const decimalCount = isDecimalMode ? rawValue.split(".")[1].length : 0;

  const displayValue = useMemo(() => formatValue(value), [value, formatValue]);

  /* ------------------------------------------------------------------- */
  /*                           Keyboard logic                            */
  /* ------------------------------------------------------------------- */

  const handleKeyPress = (key: Key): void => {
    let newValue = getRawValue(value);

    switch (key) {
      case "backspace":
        newValue = newValue.slice(0, -1);
        break;
      case "clear":
        newValue = "";
        break;
      case ".":
        if (allowDecimals && !newValue.includes(".")) {
          newValue = newValue === "" ? "0." : `${newValue}.`;
        }
        break;
      default: {
        // Digit 0‑9
        const [, frac = ""] = newValue.split(".");
        if (newValue.includes(".") && frac.length >= maxFractionDigits) return;
        newValue += key;
      }
    }

    // maxValue guard
    if (maxValue !== undefined && newValue && newValue !== "0.") {
      const numeric = Number.parseFloat(newValue);
      if (!Number.isNaN(numeric) && numeric > maxValue) return;
    }

    onChange(newValue);
    const numeric = Number.parseFloat(newValue);
    onChangeNumeric?.(Number.isNaN(numeric) ? 0 : numeric);
  };

  /* ------------------------------------------------------------------- */
  /*                         Display helpers                             */
  /* ------------------------------------------------------------------- */

  const renderFormattedDisplay = (): JSX.Element | string => {
    if (!displayValue) {
      return (
        <span className="text-muted-foreground">
          {integerFormatter.format(Number.parseFloat(placeholder))}
        </span>
      );
    }

    if (!isDecimalMode) return displayValue;

    const [whole, fraction = ""] = displayValue.split(decimalSeparator);
    const remaining = maxFractionDigits - decimalCount;

    return (
      <>
        {whole}
        <span className="text-primary font-bold">{decimalSeparator}</span>
        <span className="text-primary font-bold">{fraction}</span>
        {remaining > 0 && (
          <span className="text-muted-foreground opacity-50">
            {"0".repeat(remaining)}
          </span>
        )}
      </>
    );
  };

  /* ------------------------------------------------------------------- */
  /*                             UI pieces                               */
  /* ------------------------------------------------------------------- */

  const Keyboard = (): JSX.Element => (
    <div className="grid grid-cols-3 gap-2 w-full max-w-xs mx-auto">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
        <Button
          key={num}
          type="button"
          disabled={disabled}
          onClick={() => handleKeyPress(num.toString() as Key)}
          className={cn("h-14 text-xl font-medium", buttonClassName)}
          variant="outline"
        >
          {num}
        </Button>
      ))}

      {allowDecimals && (
        <Button
          type="button"
          onClick={() => handleKeyPress(".")}
          className={cn(
            "h-14 text-xl font-medium",
            isDecimalMode ? "bg-primary/10 border-primary" : "",
            buttonClassName,
          )}
          variant="outline"
          disabled={disabled || isDecimalMode}
        >
          {decimalSeparator}
        </Button>
      )}

      <Button
        type="button"
        onClick={() => handleKeyPress("0")}
        className={cn("h-14 text-xl font-medium", buttonClassName)}
        variant="outline"
        disabled={disabled}
      >
        0
      </Button>

      <Button
        type="button"
        onClick={() => handleKeyPress("backspace")}
        className={cn("h-14", buttonClassName)}
        variant="outline"
        disabled={disabled}
      >
        <BackspaceIcon className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        onClick={() => handleKeyPress("clear")}
        className={cn("h-14 col-span-3 mt-2", buttonClassName)}
        variant="outline"
        disabled={disabled}
      >
        Clear
      </Button>
    </div>
  );

  /* ------------------------------------------------------------------- */
  /*                               Render                                */
  /* ------------------------------------------------------------------- */

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      {/* Display */}
      <div
        ref={inputRef}
        onClick={() =>
          !disabled && keyboardType === "modal" && setIsKeyboardOpen(true)
        }
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "w-full p-4 text-3xl font-bold text-right border rounded-md mb-4 cursor-pointer",
          "focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:outline-none relative",
          isDecimalMode && "border-primary",
          (isHovered || isFocused) &&
            keyboardType === "modal" &&
            "border-primary bg-primary/5",
          displayClassName,
        )}
        tabIndex={0}
        role="textbox"
        aria-label={`${label} input`}
        aria-haspopup={keyboardType === "modal" ? "dialog" : undefined}
      >
        {renderFormattedDisplay()}

        {keyboardType === "modal" && (
          <div
            className={cn(
              "absolute left-3 top-1/2 transform -translate-y-1/2 transition-opacity",
              isHovered || isFocused ? "opacity-100" : "opacity-0",
            )}
            aria-hidden="true"
          >
            <EditIcon className="h-5 w-5 text-primary" />
          </div>
        )}
      </div>

      {/* Keyboard */}
      {keyboardType === "inline" ? (
        <Keyboard />
      ) : (
        <Dialog open={isKeyboardOpen} onOpenChange={setIsKeyboardOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Enter {label}</DialogTitle>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsKeyboardOpen(false)}
                className="absolute right-4 top-4"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>

            {/* Mirrored display in modal */}
            <div className="bg-muted/30 p-4 rounded-md mb-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Current Value
              </div>
              <div className="text-3xl font-bold">
                {displayValue ||
                  formatter.format(Number.parseFloat(placeholder))}
              </div>
            </div>

            <Keyboard />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
