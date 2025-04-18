"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { ArrowLeft, SettingsIcon } from "lucide-react"
import { StaffManagement } from "@/components/staff-management"
import { RestaurantSettings } from "@/components/restaurant-settings"
import { useRestaurantConfig } from "@/contexts/restaurant-config"

export function SettingsView() {
  const router = useRouter()
  const config = useRestaurantConfig()
  const [activeTab, setActiveTab] = useState("staff")

  const handleBack = () => {
    router.push("/tables")
  }

  return (
    <Card className="w-full max-w-5xl shadow-lg">
      <CardHeader className="bg-gray-100 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to tables" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl flex items-center">
                <SettingsIcon className="h-5 w-5 mr-2" />
                Settings
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">{config?.name || "Restaurant"} Configuration</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 p-0 border-b rounded-none">
          <TabsTrigger value="staff" className="rounded-none data-[state=active]:bg-gray-100">
            Staff Management
          </TabsTrigger>
          <TabsTrigger value="restaurant" className="rounded-none data-[state=active]:bg-gray-100">
            Restaurant Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="p-0 mt-0">
          <StaffManagement />
        </TabsContent>

        <TabsContent value="restaurant" className="p-0 mt-0">
          <RestaurantSettings />
        </TabsContent>
      </Tabs>
    </Card>
  )
}
