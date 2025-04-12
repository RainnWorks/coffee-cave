import type { Staff } from "@/components/pos-login"

// Mock staff data
const staffData: Array<Staff & { firstName: string; lastName: string; id: string }> = [
  { id: "1", username: "jsmith", firstName: "John", lastName: "Smith", initials: "JS", pin: "1234" },
  { id: "2", username: "sjohnson", firstName: "Sarah", lastName: "Johnson", initials: "SJ", pin: "5678" },
  { id: "3", username: "mbrown", firstName: "Michael", lastName: "Brown", initials: "MB", pin: "9012" },
  { id: "4", username: "edavis", firstName: "Emily", lastName: "Davis", initials: "ED", pin: "3456" },
]

// Get all staff members
export async function getAllStaff() {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // In a real app, this would be: fetch('/api/staff')
  return [...staffData]
}

// Create a new staff member
export async function createStaff(staffDetails: {
  username: string
  firstName: string
  lastName: string
  pin: string
}) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // In a real app, this would be:
  // const response = await fetch('/api/staff/create', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(staffDetails)
  // })
  // return response.json()

  // For now, just return the staff details
  const initials = staffDetails.firstName.charAt(0) + staffDetails.lastName.charAt(0)
  return {
    ...staffDetails,
    initials,
  }
}

// Delete a staff member
export async function deleteStaff(id: string) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  // In a real app, this would be:
  // const response = await fetch(`/api/staff/${id}`, {
  //   method: 'DELETE'
  // })
  // return response.json()

  // For now, just return success
  return { success: true }
}

// Update a staff member
export async function updateStaff(
  id: string,
  staffDetails: {
    username?: string
    firstName?: string
    lastName?: string
    pin?: string
  },
) {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // In a real app, this would be:
  // const response = await fetch(`/api/staff/${id}`, {
  //   method: 'PUT',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(staffDetails)
  // })
  // return response.json()

  // For now, just return success
  return { success: true }
}
