import { cn } from "@/lib/utils";
import * as React from "react";
import { Input } from "./input";

export interface CurrencyInputProps extends React.ComponentProps<"input"> {
  currencyFormat?: Intl.NumberFormat;
}

const defaultCurrencyFormat = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    { className, currencyFormat, onChange, onFocus, maxLength, ...props },
    ref
  ) => {
    const formatCurrency = (value: number) => {
      return (currencyFormat ?? defaultCurrencyFormat).format(value);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      target.setSelectionRange(target.value.length, target.value.length);
      onFocus?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const target = e.currentTarget;
      const numericValue = Number(target.value.replace(/\D/g, "")) / 100;
      target.value = formatCurrency(numericValue);
      onChange?.(e);
    };

    return (
      <Input
        className={cn("text-end", className)}
        maxLength={maxLength ?? 22}
        onFocus={handleFocus}
        onChange={handleChange}
        ref={ref}
        {...props}
      />
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
