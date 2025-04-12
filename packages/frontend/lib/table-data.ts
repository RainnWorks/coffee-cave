import type { Table } from "@/components/tables-view"

// Mock data for tables with tabs
export function getTableData(id: string): Table {
  // This would normally come from an API or database
  if (id === "5") {
    return {
      id: "5",
      number: 5,
      seats: 4,
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
    }
  } else if (id === "8") {
    return {
      id: "8",
      number: 8,
      seats: 8,
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
        {
          id: "t8",
          name: "Group 2",
          items: [
            {
              id: "i20",
              name: "French Toast",
              category: "food",
              price: 11.5,
              quantity: 2,
              paidAmount: 0,
              paymentStatus: "unpaid",
            },
            {
              id: "i21",
              name: "Omelette",
              category: "food",
              price: 13.5,
              quantity: 2,
              paidAmount: 0,
              paymentStatus: "unpaid",
            },
          ],
          amountDue: 50.0,
          amountPaid: 0,
          status: "open",
          openTime: "2:20 PM",
          payments: [],
        },
      ],
    }
  }

  // Default table with one tab
  return {
    id,
    number: Number.parseInt(id),
    seats: 4,
    tabs: [
      {
        id: "t1",
        name: "Tab 1",
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
        openTime: "1:30 PM",
        payments: [],
      },
    ],
  }
}

