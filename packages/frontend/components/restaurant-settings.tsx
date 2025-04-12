"use client"

import type React from "react"

import { useState } from "react"
import { CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Save, Store } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRestaurantConfig } from "@/contexts/restaurant-config"

export function RestaurantSettings() {
  const { toast } = useToast()
  const { config, updateConfig } = useRestaurantConfig()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [restaurantName, setRestaurantName] = useState(config?.name || "")
  const [currencySymbol, setCurrencySymbol] = useState(config?.currencySymbol || "$")
  const [taxRate, setTaxRate] = useState(config?.taxRate ? (config.taxRate * 100).toString() : "8.25")
  const [serviceChargeRate, setServiceChargeRate] = useState(
    config?.serviceChargeRate ? (config.serviceChargeRate * 100).toString() : "18",
  )
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">(config?.timeFormat || "12h")
  const [address, setAddress] = useState(config?.address || "")
  const [phone, setPhone] = useState(config?.phone || "")
  const [website, setWebsite] = useState(config?.website || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!restaurantName) {
      toast({
        title: "Validation Error",
        description: "Restaurant name is required",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // In a real app, this would be an API call
      // For now, we'll just update the local state
      updateConfig({
        name: restaurantName,
        currencySymbol,
        taxRate: Number.parseFloat(taxRate) / 100,
        serviceChargeRate: Number.parseFloat(serviceChargeRate) / 100,
        timeFormat,
        address,
        phone,
        website,
      })

      toast({
        title: "Settings Updated",
        description: "Restaurant settings have been updated successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Error updating settings:", error)
      toast({
        title: "Error",
        description: "Failed to update restaurant settings",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <CardContent className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Store className="h-5 w-5 mr-2" />
          Restaurant Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">Configure your restaurant information and preferences</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="Enter restaurant name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencySymbol">Currency Symbol</Label>
            <Input
              id="currencySymbol"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              placeholder="$"
              maxLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="Enter tax rate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceChargeRate">Default Service Charge (%)</Label>
            <Input
              id="serviceChargeRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={serviceChargeRate}
              onChange={(e) => setServiceChargeRate(e.target.value)}
              placeholder="Enter service charge rate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select value={timeFormat} onValueChange={(value) => setTimeFormat(value as "12h" | "24h")}>
              <SelectTrigger id="timeFormat">
                <SelectValue placeholder="Select time format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12-hour (AM/PM)</SelectItem>
                <SelectItem value="24h">24-hour</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter restaurant address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="Enter website URL"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>
    </CardContent>
  )
}
