"use client";

import type React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardContent } from "@/components/ui/card";
import { Store } from "lucide-react";
import { useRestaurantConfig } from "@/contexts/restaurant-config";

export function RestaurantSettings() {
  const config = useRestaurantConfig();

  return (
    <CardContent className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Store className="h-5 w-5 mr-2" />
          Restaurant Settings
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure your restaurant information and preferences
        </p>
      </div>

      <form className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="restaurantName">Restaurant Name</Label>
            <Input
              id="restaurantName"
              value={config?.name || ""}
              placeholder="Enter restaurant name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currencyCode">Currency Code</Label>
            <Input
              id="currencyCode"
              value={config?.currencyCode || "EUR"}
              placeholder="EUR"
              maxLength={3}
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeZone">Time Zone</Label>
            <Input
              id="timeZone"
              value={config?.timeZone || "Europe/Paris"}
              placeholder="Europe/Paris"
              disabled
            />
          </div>
        </div>
      </form>
    </CardContent>
  );
}
