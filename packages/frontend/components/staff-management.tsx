"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, UserPlus, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getAllStaff, createStaff, deleteStaff } from "@/lib/staff-api"

interface StaffMember {
  id: string
  username: string
  firstName: string
  lastName: string
  pin: string
}

export function StaffManagement() {
  const { toast } = useToast()
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [pin, setPin] = useState("")

  useEffect(() => {
    loadStaffMembers()
  }, [])

  // Auto-generate username when first or last name changes
  useEffect(() => {
    if (firstName && lastName) {
      const generatedUsername = generateUsername(firstName, lastName)
      setUsername(generatedUsername)
    }
  }, [firstName, lastName])

  // Generate random PIN when form is shown
  useEffect(() => {
    if (showAddForm) {
      setPin(generateRandomPin())
    }
  }, [showAddForm])

  const loadStaffMembers = async () => {
    setIsLoading(true)
    try {
      const staff = await getAllStaff()
      setStaffMembers(staff)
    } catch (error) {
      console.error("Error loading staff members:", error)
      toast({
        title: "Error",
        description: "Failed to load staff members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateUsername = (first: string, last: string) => {
    // Take first initial + last name, remove special characters, and convert to lowercase
    const firstInitial = first.charAt(0)
    const sanitizedLastName = last.replace(/[^a-zA-Z0-9]/g, "")
    return (firstInitial + sanitizedLastName).toLowerCase()
  }

  const generateRandomPin = () => {
    // Generate a random 4-digit PIN
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!firstName || !lastName || !username || !pin) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      })
      return
    }

    if (pin.length !== 4 || !/^\d+$/.test(pin)) {
      toast({
        title: "Validation Error",
        description: "PIN must be a 4-digit number",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const newStaff = await createStaff({
        username,
        firstName,
        lastName,
        pin,
      })

      // In a real app, the API would return the new staff member with an ID
      // For now, we'll simulate this by adding a fake ID
      const staffWithId = {
        ...newStaff,
        id: `staff_${Date.now()}`,
      }

      setStaffMembers([...staffMembers, staffWithId])

      toast({
        title: "Staff Added",
        description: `${firstName} ${lastName} has been added successfully`,
        variant: "success",
      })

      // Reset form
      setFirstName("")
      setLastName("")
      setUsername("")
      setPin("")
      setShowAddForm(false)
    } catch (error) {
      console.error("Error creating staff member:", error)
      toast({
        title: "Error",
        description: "Failed to create staff member",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      await deleteStaff(id)

      // Update local state
      setStaffMembers(staffMembers.filter((staff) => staff.id !== id))

      toast({
        title: "Staff Removed",
        description: "Staff member has been removed successfully",
        variant: "success",
      })
    } catch (error) {
      console.error("Error deleting staff member:", error)
      toast({
        title: "Error",
        description: "Failed to delete staff member",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <CardContent className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Staff Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage staff members who can access the POS system</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="gap-2">
          {showAddForm ? (
            <>Cancel</>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Add Staff
            </>
          )}
        </Button>
      </div>

      {showAddForm && (
        <Card className="mb-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h3 className="font-medium mb-4">Add New Staff Member</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username will be auto-generated"
                  />
                  <p className="text-xs text-gray-500">Auto-generated from name, but can be edited</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">PIN (4 digits)</Label>
                  <Input
                    id="pin"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                    placeholder="Enter 4-digit PIN"
                    maxLength={4}
                  />
                  <p className="text-xs text-gray-500">Random PIN generated, can be changed</p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="gap-2">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Add Staff Member
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="border rounded-md">
        <div className="bg-gray-50 p-3 border-b grid grid-cols-5 font-medium">
          <div className="col-span-1">Username</div>
          <div className="col-span-1">First Name</div>
          <div className="col-span-1">Last Name</div>
          <div className="col-span-1">PIN</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Loading staff members...</p>
            </div>
          ) : staffMembers.length > 0 ? (
            staffMembers.map((staff) => (
              <div key={staff.id} className="p-3 grid grid-cols-5 items-center">
                <div className="col-span-1 font-medium">{staff.username}</div>
                <div className="col-span-1">{staff.firstName}</div>
                <div className="col-span-1">{staff.lastName}</div>
                <div className="col-span-1">{staff.pin}</div>
                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(staff.id)}
                    disabled={deletingId === staff.id}
                    className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                  >
                    {deletingId === staff.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              No staff members found. Add your first staff member to get started.
            </div>
          )}
        </div>
      </div>
    </CardContent>
  )
}
