"use client"

import { useState } from "react"
import type { MenuItem } from "@/components/tables-view"
import { Button } from "@/components/ui/button"
import { X, Plus, Minus, Coffee, Utensils, IceCream } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"

interface AddItemOverlayProps {
  tabId: string
  onClose: () => void
  onAddItem: (item: MenuItem) => void
}

// Mock menu items
const menuItems = {
  drinks: [
    { id: "d1", name: "Espresso", price: 3.5 },
    { id: "d2", name: "Cappuccino", price: 4.5 },
    { id: "d3", name: "Latte", price: 4.75 },
    { id: "d4", name: "Americano", price: 3.75 },
    { id: "d5", name: "Mocha", price: 5.25 },
    { id: "d6", name: "Tea", price: 3.25 },
    { id: "d7", name: "Iced Coffee", price: 4.25 },
    { id: "d8", name: "Orange Juice", price: 3.75 },
  ],
  food: [
    { id: "f1", name: "Avocado Toast", price: 12.5 },
    { id: "f2", name: "Eggs Benedict", price: 14.5 },
    { id: "f3", name: "Pancakes", price: 10.5 },
    { id: "f4", name: "French Toast", price: 11.5 },
    { id: "f5", name: "Omelette", price: 13.5 },
    { id: "f6", name: "Breakfast Sandwich", price: 9.5 },
    { id: "f7", name: "Quiche", price: 8.75 },
    { id: "f8", name: "Croissant", price: 3.5 },
  ],
  dessert: [
    { id: "s1", name: "Cheesecake", price: 7.5 },
    { id: "s2", name: "Chocolate Cake", price: 6.5 },
    { id: "s3", name: "Tiramisu", price: 8.5 },
    { id: "s4", name: "Ice Cream", price: 5.5 },
    { id: "s5", name: "Fruit Tart", price: 6.75 },
    { id: "s6", name: "Brownie", price: 4.5 },
  ],
}

export function AddItemOverlay({ tabId, onClose, onAddItem }: AddItemOverlayProps) {
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("drinks")
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [quantity, setQuantity] = useState<number>(1)

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // Filter menu items based on search query
  const filteredItems = searchQuery
    ? Object.values(menuItems)
        .flat()
        .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : menuItems[selectedCategory as keyof typeof menuItems]

  // Handle adding item to tab
  const handleAddItem = () => {
    if (!selectedItem) return

    const newItem: MenuItem = {
      id: `i${Date.now()}`,
      name: selectedItem.name,
      category: selectedCategory as "food" | "drinks" | "dessert" | "other",
      price: selectedItem.price,
      quantity,
    }

    onAddItem(newItem)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold">Add Item</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <Input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {!searchQuery && (
            <Tabs defaultValue="drinks" value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="grid grid-cols-3 mb-6">
                <TabsTrigger value="drinks" className="gap-2">
                  <Coffee className="h-4 w-4" />
                  Drinks
                </TabsTrigger>
                <TabsTrigger value="food" className="gap-2">
                  <Utensils className="h-4 w-4" />
                  Food
                </TabsTrigger>
                <TabsTrigger value="dessert" className="gap-2">
                  <IceCream className="h-4 w-4" />
                  Dessert
                </TabsTrigger>
              </TabsList>

              <TabsContent value="drinks" className="mt-0">
                <MenuItemGrid items={menuItems.drinks} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
              </TabsContent>

              <TabsContent value="food" className="mt-0">
                <MenuItemGrid items={menuItems.food} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
              </TabsContent>

              <TabsContent value="dessert" className="mt-0">
                <MenuItemGrid items={menuItems.dessert} selectedItem={selectedItem} onSelectItem={setSelectedItem} />
              </TabsContent>
            </Tabs>
          )}

          {searchQuery && (
            <div className="border rounded-lg">
              <div className="p-3 bg-gray-50 border-b">
                <h3 className="font-medium">Search Results</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 border rounded-md cursor-pointer ${
                        selectedItem?.id === item.id ? "border-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => {
                        setSelectedItem(item)
                        // Set the category based on the item
                        Object.entries(menuItems).forEach(([category, items]) => {
                          if (items.some((i) => i.id === item.id)) {
                            setSelectedCategory(category)
                          }
                        })
                      }}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(item.price)}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-4 text-center text-gray-500">
                    No items found matching "{searchQuery}"
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedItem && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{selectedItem.name}</div>
                  <div className="text-gray-500">{formatCurrency(selectedItem.price)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-8 text-center">{quantity}</span>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm">Total:</div>
                <div className="font-bold">{formatCurrency(selectedItem.price * quantity)}</div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button className="flex-1 gap-1" onClick={handleAddItem} disabled={!selectedItem}>
              <Plus className="h-4 w-4" />
              Add to Tab
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface MenuItemGridProps {
  items: any[]
  selectedItem: any | null
  onSelectItem: (item: any) => void
}

function MenuItemGrid({ items, selectedItem, onSelectItem }: MenuItemGridProps) {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {items.map((item) => (
        <div
          key={item.id}
          className={`p-3 border rounded-md cursor-pointer ${
            selectedItem?.id === item.id ? "border-blue-500 bg-blue-50" : ""
          }`}
          onClick={() => onSelectItem(item)}
        >
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-gray-500">{formatCurrency(item.price)}</div>
        </div>
      ))}
    </div>
  )
}

