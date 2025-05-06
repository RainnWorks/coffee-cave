"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";
import {
  useCoinsAndNotes,
  useCurrencyFormatter,
  useCurrencyUtils,
} from "@/contexts/restaurant-config";

export interface ChangeCalculatorProps {
  /**
   * The amount due from the customer
   */
  amountDue: number;

  /**
   * Optional callback when the amount tendered changes
   */
  onAmountTenderedChange?: (amount: number) => void;

  /**
   * Optional CSS class name for the container
   */
  className?: string;
}

/**
 * A reusable component for calculating change in point-of-sale applications
 */
export function ChangeCalculator({
  amountDue,
  onAmountTenderedChange,
  className,
}: ChangeCalculatorProps) {
  // State for the amount tendered by the customer
  const [amountTendered, setAmountTendered] = useState<number>(0);
  const denominations = useCoinsAndNotes();
  const { minorToMajor } = useCurrencyUtils();

  const format = useCurrencyFormatter();
  // Calculate change amount (positive means change is due to customer)
  const changeAmount = amountTendered - amountDue;

  // Format the input value for display
  const formattedInput = useMemo(() => {
    return format(amountTendered);
  }, [amountTendered, format]);

  // Handle direct input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^\d.]/g, "");
    const numericValue = Number.parseFloat(value);

    if (!isNaN(numericValue)) {
      setAmountTendered(numericValue);
      onAmountTenderedChange?.(numericValue);
    } else if (value === "" || value === ".") {
      setAmountTendered(0);
      onAmountTenderedChange?.(0);
    }
  };

  // Handle denomination button clicks
  const handleDenominationClick = (
    amount: number,
    operation: "add" | "subtract"
  ) => {
    const denominationValue = amount;
    const newAmount =
      operation === "add"
        ? amountTendered + denominationValue
        : Math.max(0, amountTendered - denominationValue);

    setAmountTendered(newAmount);
    onAmountTenderedChange?.(newAmount);
  };

  // Notify parent component on mount and when amount changes
  useEffect(() => {
    onAmountTenderedChange?.(amountTendered);
  }, [amountTendered, onAmountTenderedChange]);

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-4", className)}>
      {/* Amount tendered input */}
      <div className="space-y-2">
        <label htmlFor="amount-tendered" className="text-sm font-medium">
          Amount Tendered
        </label>
        <div className="relative">
          <input
            id="amount-tendered"
            type="text"
            inputMode="decimal"
            disabled
            value={formattedInput}
            onChange={handleInputChange}
            className="w-full p-4 text-2xl font-bold text-right border rounded-md focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
            aria-label="Amount tendered by customer"
          />
        </div>
      </div>

      {/* Denomination buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium">Quick Add/Remove</h3>
        <div className="grid grid-cols-3 gap-3">
          {denominations.map((denomination) => (
            <div key={denomination} className="flex flex-col space-y-1">
              <div className="text-sm text-center font-medium">
                {format(denomination)}
              </div>
              <div className="flex space-x-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() =>
                    handleDenominationClick(denomination, "subtract")
                  }
                  disabled={amountTendered < minorToMajor(denomination)}
                  aria-label={`Subtract ${format(denomination)}`}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 h-12"
                  onClick={() => handleDenominationClick(denomination, "add")}
                  aria-label={`Add ${format(denomination)}`}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            // variant=""
            className="h-full"
            onClick={() => {
              setAmountTendered(0);
              onAmountTenderedChange?.(0);
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Change calculation result */}
      <div className="mt-6 p-4 rounded-md border text-center">
        {changeAmount === 0 ? (
          <div className="text-xl font-medium">Exact amount received</div>
        ) : changeAmount > 0 ? (
          <div className="text-xl font-medium text-green-600">
            Change:{" "}
            <span className="font-bold text-2xl">{format(changeAmount)}</span>
          </div>
        ) : (
          <div className="text-xl font-medium text-red-600">
            Still owed:{" "}
            <span className="font-bold text-2xl">
              {format(Math.abs(changeAmount))}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
