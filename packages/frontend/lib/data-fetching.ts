import type { Table, Tab, MenuItem, Payment } from "@/components/tables-view"

// This file centralizes all data fetching logic
// Replace these functions with actual API calls when implementing the backend

// Extended table type with additional fields
export interface TableWithDetails extends Table {
  guestName?: string
  allergies?: string
  createdAt: string
}

// Mock data for tables with tabs
const tablesData: TableWithDetails[] = [
  {
    id: "1",
    number: 1,
    seats: 2,
    guestName: "John & Sarah",
    allergies: "Peanuts, shellfish",
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: "t1",
        name: "Couple",
        items: [
          {
            id: "i1",
            name: "Cappuccino",
            category: "drinks",
            price: 4.5,
            quantity: 2,
            paidAmount: 0,
            paymentStatus: "unpaid",
          },
          {
            id: "i2",
            name: "Avocado Toast",
            category: "food",
            price: 12.5,
            quantity: 1,
            paidAmount: 0,
            paymentStatus: "unpaid",
          },
          {
            id: "i3",
            name: "Croissant",
            category: "food",
            price: 3.5,
            quantity: 1,
            paidAmount: 0,
            paymentStatus: "unpaid",
          },
        ],
        amountDue: 25.0,
        amountPaid: 0,
        status: "open",
        openTime: "12:30 PM",
        payments: [],
      },
    ],
  },
  {
    id: "5",
    number: 5,
    seats: 4,
    guestName: "Martinez Family",
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: "t4",
        name: "Drinks",
        items: [
          {
            id: "i10",
            name: "Latte",
            category: "drinks",
            price: 4.75,
            quantity: 2,
            paidAmount: 4.75,
            paymentStatus: "partial",
          },
          {
            id: "i11",
            name: "Iced Tea",
            category: "drinks",
            price: 3.5,
            quantity: 2,
            paidAmount: 0,
            paymentStatus: "unpaid",
          },
        ],
        amountDue: 16.5,
        amountPaid: 4.75,
        status: "open",
        openTime: "2:45 PM",
        payments: [
          {
            id: "p1",
            amount: 4.75,
            method: "card",
            timestamp: "3:15 PM",
            note: "Partial payment",
            allocations: [{ itemId: "i10", amount: 4.75 }],
          },
        ],
      },
      {
        id: "t5",
        name: "Food",
        items: [
          {
            id: "i12",
            name: "Caesar Salad",
            category: "food",
            price: 10.5,
            quantity: 2,
            paidAmount: 21.0,
            paymentStatus: "paid",
          },
          {
            id: "i13",
            name: "Chicken Sandwich",
            category: "food",
            price: 12.75,
            quantity: 2,
            paidAmount: 25.5,
            paymentStatus: "paid",
          },
          {
            id: "i14",
            name: "Cheesecake",
            category: "dessert",
            price: 7.5,
            quantity: 2,
            paidAmount: 0,
            paymentStatus: "unpaid",
            allergies: ["Dairy", "Gluten"],
          },
        ],
        amountDue: 61.5,
        amountPaid: 46.5,
        status: "open",
        openTime: "3:00 PM",
        payments: [
          {
            id: "p2",
            amount: 46.5,
            method: "cash",
            timestamp: "3:30 PM",
            note: "Paid for food items",
            allocations: [
              { itemId: "i12", amount: 21.0 },
              { itemId: "i13", amount: 25.5 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "8",
    number: 8,
    seats: 8,
    guestName: "Birthday Party",
    allergies: "Gluten, dairy",
    createdAt: new Date().toISOString(),
    tabs: [
      {
        id: "t7",
        name: "Group 1",
        items: [
          {
            id: "i18",
            name: "Mimosa",
            category: "drinks",
            price: 8.5,
            quantity: 4,
            paidAmount: 17.0,
            paymentStatus: "partial",
          },
          {
            id: "i19",
            name: "Bloody Mary",
            category: "drinks",
            price: 9.5,
            quantity: 2,
            paidAmount: 0,
            paymentStatus: "unpaid",
            allergies: ["Celery"],
          },
        ],
        amountDue: 53.0,
        amountPaid: 17.0,
        status: "open",
        openTime: "2:15 PM",
        payments: [
          {
            id: "p3",
            amount: 17.0,
            method: "card",
            timestamp: "2:45 PM",
            note: "Partial payment for drinks",
            allocations: [{ itemId: "i18", amount: 17.0 }],
          },
        ],
      },
    ],
  },
]

// Mock menu items
export const menuItems = {
  drinks: [
    { id: "d1", name: "Espresso", price: 3.5, category: "drinks" },
    { id: "d2", name: "Cappuccino", price: 4.5, category: "drinks" },
    { id: "d3", name: "Latte", price: 4.75, category: "drinks" },
    { id: "d4", name: "Americano", price: 3.75, category: "drinks" },
    { id: "d5", name: "Mocha", price: 5.25, category: "drinks" },
    { id: "d6", name: "Tea", price: 3.25, category: "drinks" },
    { id: "d7", name: "Iced Coffee", price: 4.25, category: "drinks" },
    { id: "d8", name: "Orange Juice", price: 3.75, category: "drinks" },
  ],
  food: [
    { id: "f1", name: "Avocado Toast", price: 12.5, category: "food" },
    { id: "f2", name: "Eggs Benedict", price: 14.5, category: "food" },
    { id: "f3", name: "Pancakes", price: 10.5, category: "food" },
    { id: "f4", name: "French Toast", price: 11.5, category: "food" },
    { id: "f5", name: "Omelette", price: 13.5, category: "food" },
    { id: "f6", name: "Breakfast Sandwich", price: 9.5, category: "food" },
    { id: "f7", name: "Quiche", price: 8.75, category: "food" },
    { id: "f8", name: "Croissant", price: 3.5, category: "food" },
  ],
  dessert: [
    { id: "s1", name: "Cheesecake", price: 7.5, category: "dessert" },
    { id: "s2", name: "Chocolate Cake", price: 6.5, category: "dessert" },
    { id: "s3", name: "Tiramisu", price: 8.5, category: "dessert" },
    { id: "s4", name: "Ice Cream", price: 5.5, category: "dessert" },
    { id: "s5", name: "Fruit Tart", price: 6.75, category: "dessert" },
    { id: "s6", name: "Brownie", price: 4.5, category: "dessert" },
  ],
  appetizers: [
    { id: "a1", name: "Bruschetta", price: 8.5, category: "appetizers" },
    { id: "a2", name: "Calamari", price: 12.5, category: "appetizers" },
    { id: "a3", name: "Mozzarella Sticks", price: 9.5, category: "appetizers" },
    { id: "a4", name: "Nachos", price: 11.5, category: "appetizers" },
  ],
  salads: [
    { id: "sa1", name: "Caesar Salad", price: 10.5, category: "salads" },
    { id: "sa2", name: "Greek Salad", price: 11.5, category: "salads" },
    { id: "sa3", name: "Cobb Salad", price: 13.5, category: "salads" },
    { id: "sa4", name: "Garden Salad", price: 9.5, category: "salads" },
  ],
  sandwiches: [
    { id: "sw1", name: "Club Sandwich", price: 12.5, category: "sandwiches" },
    { id: "sw2", name: "BLT", price: 10.5, category: "sandwiches" },
    { id: "sw3", name: "Chicken Sandwich", price: 12.75, category: "sandwiches" },
    { id: "sw4", name: "Veggie Wrap", price: 11.5, category: "sandwiches" },
  ],
  entrees: [
    { id: "e1", name: "Steak", price: 24.5, category: "entrees" },
    { id: "e2", name: "Salmon", price: 22.5, category: "entrees" },
    { id: "e3", name: "Chicken Parmesan", price: 18.5, category: "entrees" },
    { id: "e4", name: "Pasta Primavera", price: 16.5, category: "entrees" },
  ],
  sides: [
    { id: "si1", name: "French Fries", price: 4.5, category: "sides" },
    { id: "si2", name: "Onion Rings", price: 5.5, category: "sides" },
    { id: "si3", name: "Mashed Potatoes", price: 4.5, category: "sides" },
    { id: "si4", name: "Steamed Vegetables", price: 5.5, category: "sides" },
  ],
  specials: [
    { id: "sp1", name: "Chef's Special", price: 26.5, category: "specials" },
    { id: "sp2", name: "Catch of the Day", price: 24.5, category: "specials" },
    { id: "sp3", name: "Seasonal Dish", price: 22.5, category: "specials" },
  ],
  kids: [
    { id: "k1", name: "Chicken Tenders", price: 8.5, category: "kids" },
    { id: "k2", name: "Mac & Cheese", price: 7.5, category: "kids" },
    { id: "k3", name: "Grilled Cheese", price: 6.5, category: "kids" },
    { id: "k4", name: "Mini Burger", price: 8.5, category: "kids" },
  ],
}

// Get all menu categories
export function getMenuCategories(): string[] {
  return Object.keys(menuItems)
}

// Get menu items by category
export function getMenuItemsByCategory(category: string): any[] {
  return menuItems[category as keyof typeof menuItems] || []
}

// Get all tables
export async function getAllTables(): Promise<TableWithDetails[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // REPLACE WITH API CALL: fetch('/api/tables')
  return [...tablesData]
}

// Get a specific table by ID
export async function getTableById(tableId: string): Promise<TableWithDetails | null> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // REPLACE WITH API CALL: fetch(`/api/tables/${tableId}`)
  const table = tablesData.find((t) => t.id === tableId)
  return table ? { ...table } : null
}

// Create a new table with additional details
export async function createTableWithDetails(tableDetails: {
  number: number
  seats: number
  guestName?: string
  allergies?: string
}): Promise<TableWithDetails> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 800))

  // REPLACE WITH API CALL: fetch('/api/tables', { method: 'POST', body: JSON.stringify(tableDetails) })
  const newTable: TableWithDetails = {
    id: `table_${Date.now()}`,
    number: tableDetails.number,
    seats: tableDetails.seats,
    guestName: tableDetails.guestName,
    allergies: tableDetails.allergies,
    createdAt: new Date().toISOString(),
    tabs: [],
  }

  // In a real app, this would be handled by the server
  tablesData.push(newTable)

  return newTable
}

// Create a new table (legacy function)
export async function createTable(tableNumber: number, seats: number): Promise<Table> {
  return createTableWithDetails({ number: tableNumber, seats })
}

// Create a new tab for a table
export async function createTab(tableId: string, tabName = ""): Promise<Tab> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 600))

  // REPLACE WITH API CALL: fetch(`/api/tables/${tableId}/tabs`, { method: 'POST', body: JSON.stringify({ name: tabName }) })
  const newTab: Tab = {
    id: `tab_${Date.now()}`,
    name: tabName || "New Tab",
    items: [],
    amountDue: 0,
    amountPaid: 0,
    status: "open",
    openTime: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    payments: [],
  }

  // Find the table and add the tab
  const table = tablesData.find((t) => t.id === tableId)
  if (table) {
    table.tabs.push(newTab)
  }

  return newTab
}

// Update the addItemsToTab function to support notes and allergies
export async function addItemsToTab(
  tableId: string,
  tabId: string,
  items: Array<{ menuItemId: string; quantity: number; notes?: string; allergies?: string[] }>,
): Promise<Tab | null> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 700))

  // REPLACE WITH API CALL: fetch(`/api/tables/${tableId}/tabs/${tabId}/items`, { method: 'POST', body: JSON.stringify({ items }) })

  // Find the table and tab
  const table = tablesData.find((t) => t.id === tableId)
  if (!table) return null

  const tab = table.tabs.find((t) => t.id === tabId)
  if (!tab) return null

  // Process each item
  items.forEach(({ menuItemId, quantity, notes, allergies }) => {
    // Find the menu item from all categories
    let menuItem = null
    for (const category in menuItems) {
      const found = menuItems[category as keyof typeof menuItems].find((item) => item.id === menuItemId)
      if (found) {
        menuItem = found
        break
      }
    }

    if (menuItem) {
      // Create a new tab item
      const newItem: MenuItem = {
        id: `item_${Date.now()}_${menuItemId}`,
        name: menuItem.name,
        category: menuItem.category,
        price: menuItem.price,
        quantity,
        paidAmount: 0,
        paymentStatus: "unpaid",
        notes: notes, // Add support for notes
        allergies: allergies, // Add support for allergies
        status: "not_done", // Default status for kitchen view
      }

      // Add to tab
      tab.items.push(newItem)

      // Update tab amount due
      tab.amountDue += menuItem.price * quantity
    }
  })

  return { ...tab }
}

// Process a payment with partial quantities
export async function processPayment(
  tableId: string,
  paymentDetails: Omit<Payment, "id" | "timestamp">,
  allocations: { tabId: string; itemId: string; amount: number; quantity: number }[],
): Promise<Table | null> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // REPLACE WITH API CALL: fetch(`/api/tables/${tableId}/payments`, { method: 'POST', body: JSON.stringify({ paymentDetails, allocations }) })

  // Find the table
  const table = tablesData.find((t) => t.id === tableId)
  if (!table) return null

  // Create payment record with timestamp and ID
  const payment: Payment = {
    ...paymentDetails,
    id: `payment_${Date.now()}`,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }

  // Group allocations by tab
  const tabAllocations: Record<string, { itemId: string; amount: number; quantity: number }[]> = {}

  allocations.forEach(({ tabId, itemId, amount, quantity }) => {
    if (!tabAllocations[tabId]) {
      tabAllocations[tabId] = []
    }
    tabAllocations[tabId].push({ itemId, amount, quantity })
  })

  // Update each tab with its allocations
  Object.entries(tabAllocations).forEach(([tabId, allocs]) => {
    const tab = table.tabs.find((t) => t.id === tabId)
    if (!tab) return

    // Calculate amount for this tab
    const tabAmount = allocs.reduce((sum, alloc) => sum + alloc.amount, 0)

    // Create a payment record for this tab
    const tabPayment: Payment = {
      ...payment,
      amount: tabAmount,
      allocations: allocs.map(({ itemId, amount }) => ({ itemId, amount })),
    }

    // Update items with payment allocations
    tab.items.forEach((item) => {
      const allocation = allocs.find((a) => a.itemId === item.id)
      if (allocation) {
        const newPaidAmount = item.paidAmount + allocation.amount
        const itemTotal = item.price * item.quantity

        // Determine payment status based on paid amount and total
        if (newPaidAmount >= itemTotal) {
          item.paymentStatus = "paid"
        } else if (newPaidAmount > 0) {
          item.paymentStatus = "partial"
        }

        item.paidAmount = newPaidAmount
      }
    })

    // Calculate new paid amount
    tab.amountPaid = tab.items.reduce((total, item) => total + item.paidAmount, 0)

    // Determine if tab is fully paid
    const isFullyPaid = tab.items.every((item) => item.paymentStatus === "paid")
    if (isFullyPaid) {
      tab.status = "paid"
    }

    // Add payment to tab
    tab.payments.push(tabPayment)
  })

  return { ...table }
}

// Update item status for kitchen view (simplified to done/not done)
export async function updateItemStatus(
  tableId: string,
  tabId: string,
  itemId: string,
  status: "done" | "not_done",
): Promise<boolean> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // REPLACE WITH API CALL: fetch(`/api/tables/${tableId}/tabs/${tabId}/items/${itemId}/status`, {
  //   method: 'PUT',
  //   body: JSON.stringify({ status })
  // })

  // Find the table and tab
  const table = tablesData.find((t) => t.id === tableId || t.number.toString() === tableId)
  if (!table) return false

  const tab = table.tabs.find((t) => t.id === tabId)
  if (!tab) return false

  // Find the item and update its status
  const item = tab.items.find((i) => i.id === itemId)
  if (!item) return false

  // Update the item status
  item.status = status

  return true
}

// Get tables with active items for kitchen view
export async function getTablesWithActiveItems(): Promise<TableWithDetails[]> {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Filter tables that have at least one item that is not done
  const tablesWithActiveItems = tablesData.filter((table) => {
    // Check if any tab has items that are not done
    return table.tabs.some((tab) => {
      // Check if any item in the tab is not done
      return tab.items.some((item) => item.status !== "done" && item.paymentStatus !== "paid")
    })
  })

  return tablesWithActiveItems
}
