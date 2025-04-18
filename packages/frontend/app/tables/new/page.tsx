"use client";

import { Suspense } from "react";
import { NewTableSkeleton } from "@/components/new-table-skeleton";
import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { useManifest } from "@/contexts/manifest-client";
import { Textarea } from "@/components/ui/textarea";
import { DateTime } from "luxon";

export function NewTableForm() {
  const router = useRouter();

  const { client } = useManifest();

  const [tableNumber, setTableNumber] = useState("");
  const [seats, setSeats] = useState("2");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleBack = () => {
    router.push("/tables");
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!tableNumber.trim()) {
      newErrors.tableNumber = "Table number is required";
    }

    if (!seats) {
      newErrors.seats = "Seats is required";
    } else if (isNaN(Number(seats)) || Number(seats) <= 0) {
      newErrors.seats = "Seats must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const newTable = await client.tables.create({
        seats: Number(seats),
        name: tableNumber,
        notes: notes,
        createdAt: DateTime.now().toISO()
      });

      toast.success("Table Created");

      // Navigate to the new table
      router.push(`/tables/${newTable.result?.id}`);
    } catch (error) {
      console.error("Error creating table:", error);
      toast.error("Failed to create table. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            aria-label="Back to tables"
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl">New Table</CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-number" className="text-sm font-medium">
              Table Number/Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="table-number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className={errors.tableNumber ? "border-red-500" : ""}
            />
            {errors.tableNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.tableNumber}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seats" className="text-sm font-medium">
              Number of Guests <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={() =>
                  setSeats(Math.max(1, Number(seats) - 1).toString())
                }
              >
                -
              </Button>
              <Input
                id="guest-count"
                type="number"
                min="1"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                className={`mx-2 text-center ${
                  errors.seats ? "border-red-500" : ""
                }`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={() => setSeats((Number(seats) + 1).toString())}
              >
                +
              </Button>
            </div>
            {errors.seats && (
              <p className="text-red-500 text-xs mt-1">{errors.seats}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any special requirements or additional information"
              className="min-h-[100px]"
            />
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex justify-end">
          <Button
            type="submit"
            className="w-full gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Create Table
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function NewTablePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Suspense fallback={<NewTableSkeleton />}>
        <NewTableForm />
      </Suspense>
    </main>
  );
}
