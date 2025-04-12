"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createTableWithDetails } from "@/lib/data-fetching"
import { useRestaurantConfig } from "@/contexts/restaurant-config"

export function NewTableForm() {
  const router = useRouter()
  const { toast } = useToast()
  const { config } = useRestaurantConfig()

  const [tableNumber, setTableNumber] = useState("")
  const [guestCount, setGuestCount] = useState("2")
  const [guestName, setGuestName] = useState("")
  const [allergies, setAllergies] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleBack = () => {
    router.push("/tables")
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!tableNumber) {
      newErrors.tableNumber = "Table number is required"
    } else if (isNaN(Number(tableNumber)) || Number(tableNumber) <= 0) {
      newErrors.tableNumber = "Table number must be a positive number"
    }

    if (!guestCount) {
      newErrors.guestCount = "Guest count is required"
    } else if (isNaN(Number(guestCount)) || Number(guestCount) <= 0) {
      newErrors.guestCount = "Guest count must be a positive number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    try {
      const newTable = await createTableWithDetails({
        number: Number(tableNumber),
        seats: Number(guestCount),
        guestName: guestName.trim() || undefined,
        allergies: allergies.trim() || undefined,
      })

      toast({
        title: "Table Created",
        description: `Table ${newTable.number} has been created successfully`,
        variant: "success",
      })

      // Navigate to the new table
      router.push(`/tables/${newTable.id}`)
    } catch (error) {
      console.error("Error creating table:", error)
      toast({
        title: "Error",
        description: "Failed to create table. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to tables" className="mr-4">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-2xl">New Table</CardTitle>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-number" className="text-sm font-medium">
              Table Number <span className="text-red-500">*</span>
            </Label>
            <Input
              id="table-number"
              type="number"
              min="1"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Enter table number"
              className={errors.tableNumber ? "border-red-500" : ""}
            />
            {errors.tableNumber && <p className="text-red-500 text-xs mt-1">{errors.tableNumber}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-count" className="text-sm font-medium">
              Number of Guests <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={() => setGuestCount(Math.max(1, Number(guestCount) - 1).toString())}
              >
                -
              </Button>
              <Input
                id="guest-count"
                type="number"
                min="1"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className={`mx-2 text-center ${errors.guestCount ? "border-red-500" : ""}`}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3"
                onClick={() => setGuestCount((Number(guestCount) + 1).toString())}
              >
                +
              </Button>
            </div>
            {errors.guestCount && <p className="text-red-500 text-xs mt-1">{errors.guestCount}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="guest-name" className="text-sm font-medium">
              Guest Name/Number (Optional)
            </Label>
            <Input
              id="guest-name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter guest name or reservation number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergies" className="text-sm font-medium">
              Allergies/Special Requests (Optional)
            </Label>
            <Textarea
              id="allergies"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              placeholder="Enter any allergies or special requests"
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex justify-end">
          <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
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
  )
}
