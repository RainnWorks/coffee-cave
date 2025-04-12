"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Check,
  Loader2,
  Coffee,
  Utensils,
  IceCream,
  Pizza,
  Salad,
  Sandwich,
  Beef,
  Soup,
  Cake,
  Baby,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  X,
  AlertTriangle,
  MessageSquare,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getTableById, getMenuCategories, getMenuItemsByCategory, addItemsToTab } from "@/lib/data-fetching"
import { formatCurrency } from "@/lib/payment-utils"
import { generateTabName } from "@/components/tables-view"
import { useMobile } from "@/hooks/use-mobile"
import { useRestaurantConfig } from "@/contexts/restaurant-config"
import type { Table, Tab } from "@/components/tables-view"

type MenuItemWithQuantity = {
  id: string
  name: string
  price: number
  category: string
  quantity: number
}

// Individual item in the order
type OrderItem = {
  id: string
  menuItemId: string
  name: string
  price: number
  category: string
  allergies: string[]
  notes?: string
}

// Common food allergies
const COMMON_ALLERGIES = ["Dairy", "Gluten", "Nuts", "Shellfish", "Eggs", "Soy", "Fish", "Wheat", "Peanuts", "Sesame"]

export function AddItemsView({ tableId, tabId }: { tableId: string; tabId: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()
  const { config } = useRestaurantConfig()

  const [tableData, setTableData] = useState<Table | null>(null)
  const [tab, setTab] = useState<Tab | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [menuItems, setMenuItems] = useState<MenuItemWithQuantity[]>([])
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Track quantities for menu items
  const [itemQuantities, setItemQuantities] = useState<Record<string, number>>({})

  // Track individual order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])

  // Track which item is showing allergy selector
  const [activeAllergyItem, setActiveAllergyItem] = useState<string | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [showSelectedItems, setShowSelectedItems] = useState(true)
  const [isRecapMode, setIsRecapMode] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load table data
        const table = await getTableById(tableId)
        setTableData(table)

        // Find the tab
        const currentTab = table?.tabs.find((t) => t.id === tabId) || null
        setTab(currentTab)

        // Load menu categories
        const menuCategories = getMenuCategories()
        setCategories(menuCategories)

        if (menuCategories.length > 0) {
          setSelectedCategory(menuCategories[0])

          // Load items for the first category
          const items = getMenuItemsByCategory(menuCategories[0])
          setMenuItems(items.map((item) => ({ ...item, quantity: 0 })))
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load menu data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [tableId, tabId, toast])

  // Handle category selection
  const handleCategorySelect = async (category: string) => {
    setIsCategoryLoading(true)
    setSelectedCategory(category)
    setSearchQuery("")

    try {
      // Load items for the selected category
      const items = getMenuItemsByCategory(category)
      setMenuItems(
        items.map((item) => {
          // Preserve quantity for items that are already selected
          return {
            ...item,
            quantity: itemQuantities[item.id] || 0,
          }
        }),
      )
    } catch (error) {
      console.error("Error loading category items:", error)
      toast({
        title: "Error",
        description: "Failed to load category items",
        variant: "destructive",
      })
    } finally {
      setIsCategoryLoading(false)
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim() === "") {
      // If search is cleared, show items from selected category
      const items = getMenuItemsByCategory(selectedCategory)
      setMenuItems(
        items.map((item) => {
          return {
            ...item,
            quantity: itemQuantities[item.id] || 0,
          }
        }),
      )
    } else {
      // Search across all categories
      const results: MenuItemWithQuantity[] = []
      categories.forEach((category) => {
        const categoryItems = getMenuItemsByCategory(category)
        const filteredItems = categoryItems.filter((item) => item.name.toLowerCase().includes(query.toLowerCase()))
        results.push(
          ...filteredItems.map((item) => {
            return {
              ...item,
              quantity: itemQuantities[item.id] || 0,
            }
          }),
        )
      })
      setMenuItems(results)
    }
  }

  // Handle quantity change
  const handleQuantityChange = (item: MenuItemWithQuantity, change: number) => {
    const currentQuantity = itemQuantities[item.id] || 0
    const newQuantity = Math.max(0, currentQuantity + change)

    // Update menu items quantities
    setItemQuantities((prev) => ({
      ...prev,
      [item.id]: newQuantity,
    }))

    // Update menu items
    setMenuItems((prev) =>
      prev.map((menuItem) => (menuItem.id === item.id ? { ...menuItem, quantity: newQuantity } : menuItem)),
    )

    // If decreasing quantity, remove items from the end of the list
    if (change < 0) {
      // Find items with this menuItemId
      const itemsToRemove = orderItems
        .filter((orderItem) => orderItem.menuItemId === item.id)
        .slice(newQuantity)
        .map((item) => item.id)

      if (itemsToRemove.length > 0) {
        setOrderItems((prev) => prev.filter((item) => !itemsToRemove.includes(item.id)))
      }
    }

    // If increasing quantity, add new items
    if (change > 0) {
      const newItems: OrderItem[] = []

      for (let i = 0; i < change; i++) {
        newItems.push({
          id: `${item.id}_${Date.now()}_${i}`,
          menuItemId: item.id,
          name: item.name,
          price: item.price,
          category: item.category,
          allergies: [],
        })
      }

      setOrderItems((prev) => [...prev, ...newItems])
    }
  }

  // Toggle allergy selector for an item
  const toggleAllergySelector = (itemId: string) => {
    setActiveAllergyItem(activeAllergyItem === itemId ? null : itemId)
  }

  // Handle allergy selection for an item
  const handleAllergyToggle = (itemId: string, allergy: string) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const allergies = [...item.allergies]
          const index = allergies.indexOf(allergy)

          if (index >= 0) {
            allergies.splice(index, 1)
          } else {
            allergies.push(allergy)
          }

          return { ...item, allergies }
        }
        return item
      }),
    )
  }

  // Handle notes change for an item
  const handleItemNotesChange = (itemId: string, notes: string) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, notes }
        }
        return item
      }),
    )
  }

  // Get icon for category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "drinks":
        return <Coffee className="h-4 w-4" />
      case "food":
        return <Utensils className="h-4 w-4" />
      case "dessert":
        return <IceCream className="h-4 w-4" />
      case "appetizers":
        return <Soup className="h-4 w-4" />
      case "salads":
        return <Salad className="h-4 w-4" />
      case "sandwiches":
        return <Sandwich className="h-4 w-4" />
      case "entrees":
        return <Beef className="h-4 w-4" />
      case "sides":
        return <Pizza className="h-4 w-4" />
      case "specials":
        return <Cake className="h-4 w-4" />
      case "kids":
        return <Baby className="h-4 w-4" />
      default:
        return <Utensils className="h-4 w-4" />
    }
  }

  // Handle back button
  const handleBack = () => {
    router.push(`/tables/${tableId}`)
  }

  // Handle add items
  const handleAddItems = async () => {
    if (!tableData || !tab || orderItems.length === 0) return

    setIsSubmitting(true)
    try {
      // Prepare items for submission
      const itemsToAdd = orderItems.map((item) => ({
        menuItemId: item.menuItemId,
        quantity: 1, // Each item is individual
        notes: item.notes,
        allergies: item.allergies.length > 0 ? item.allergies : undefined,
      }))

      // Add items to tab
      await addItemsToTab(tableId, tabId, itemsToAdd)

      toast({
        title: "Items Added",
        description: `${itemsToAdd.length} items added to the tab`,
        variant: "success",
      })

      // Navigate back to table detail
      router.push(`/tables/${tableId}`)
    } catch (error) {
      console.error("Error adding items:", error)
      toast({
        title: "Error",
        description: "Failed to add items to tab",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate total for selected items
  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + item.price, 0)
  }

  // Remove a specific order item
  const handleRemoveOrderItem = (itemId: string) => {
    const itemToRemove = orderItems.find((item) => item.id === itemId)

    if (!itemToRemove) return

    // Remove the item
    setOrderItems((prev) => prev.filter((item) => item.id !== itemId))

    // Update the quantity counter for the menu item
    setItemQuantities((prev) => {
      const menuItemId = itemToRemove.menuItemId
      const currentQuantity = prev[menuItemId] || 0

      if (currentQuantity <= 1) {
        const newQuantities = { ...prev }
        delete newQuantities[menuItemId]
        return newQuantities
      }

      return {
        ...prev,
        [menuItemId]: currentQuantity - 1,
      }
    })

    // Update menu items display
    setMenuItems((prev) =>
      prev.map((item) => {
        if (item.id === itemToRemove.menuItemId) {
          const newQuantity = Math.max(0, (item.quantity || 0) - 1)
          return { ...item, quantity: newQuantity }
        }
        return item
      }),
    )
  }

  // Group order items by menu item for display
  const getGroupedOrderItems = () => {
    const grouped: Record<
      string,
      {
        menuItem: MenuItemWithQuantity
        items: OrderItem[]
      }
    > = {}

    orderItems.forEach((item) => {
      if (!grouped[item.menuItemId]) {
        const menuItem = menuItems.find((mi) => mi.id === item.menuItemId)
        if (!menuItem) return

        grouped[item.menuItemId] = {
          menuItem,
          items: [],
        }
      }

      grouped[item.menuItemId].items.push(item)
    })

    return Object.values(grouped)
  }

  // Format currency using restaurant config
  const formatItemPrice = (price: number) => {
    if (config?.currencySymbol) {
      return `${config.currencySymbol}${price.toFixed(2)}`
    }
    return formatCurrency(price)
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Loading...</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="py-12 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!tableData || !tab) {
    return (
      <Card className="w-full max-w-6xl shadow-lg">
        <CardHeader className="border-b bg-gray-100">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-2xl">Tab Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500 mb-4">The requested tab could not be found.</p>
          <Button onClick={handleBack}>Return to Table</Button>
        </CardContent>
      </Card>
    )
  }

  const isTablet = !isMobile && window.innerWidth < 1024

  return (
    <Card className="w-full max-w-6xl shadow-lg">
      <CardHeader className="border-b bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" onClick={handleBack} aria-label="Back to table" className="mr-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle className="text-2xl">{isRecapMode ? "Review Order" : "Add Items"}</CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Table {tableData.number} • {generateTabName(tab)}
              </p>
            </div>
          </div>
          <Badge className="text-lg py-1.5 px-3">
            {orderItems.length} {orderItems.length === 1 ? "item" : "items"} selected
          </Badge>
        </div>
      </CardHeader>

      {isRecapMode ? (
        // Recap Mode View - Read-only display of selected items
        <>
          <CardContent className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Order Summary</h3>
              <p className="text-sm text-gray-500 mb-4">Review the order with the customer before adding to the tab.</p>

              {orderItems.length > 0 ? (
                <div className={`grid gap-4 ${isMobile ? "grid-cols-1" : "grid-cols-2"}`}>
                  {getGroupedOrderItems().map(({ menuItem, items }) => (
                    <div key={menuItem.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{menuItem.name}</h3>
                            <Badge variant="outline" className="capitalize">
                              {menuItem.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 mt-1">
                            <span>
                              {formatItemPrice(menuItem.price)} × {items.length}
                            </span>
                            <span>=</span>
                            <span className="font-medium">{formatItemPrice(menuItem.price * items.length)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-2">
                        {items.map((item, index) => (
                          <div key={item.id} className="border rounded-md p-2 bg-gray-50">
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-sm">
                                {menuItem.name} #{index + 1}
                              </div>
                            </div>

                            {item.notes && (
                              <div className="mt-1 bg-white p-2 rounded-md text-xs">
                                <p className="text-gray-700">{item.notes}</p>
                              </div>
                            )}

                            {item.allergies.length > 0 && (
                              <div className="mt-1 bg-red-50 p-2 rounded-md text-xs flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p className="font-medium text-red-700">Allergies:</p>
                                  <p className="text-red-700">{item.allergies.join(", ")}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No items selected. Go back to add items.</div>
              )}
            </div>
          </CardContent>

          <CardFooter className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center w-full">
              <div className="text-lg font-bold">Total: {formatItemPrice(calculateTotal())}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsRecapMode(false)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Back
                </Button>
                <Button className="gap-2" onClick={handleAddItems} disabled={orderItems.length === 0 || isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {isSubmitting ? "Adding..." : "Add to Tab"}
                </Button>
              </div>
            </div>
          </CardFooter>
        </>
      ) : (
        // Selection Mode View
        <>
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search menu items..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className={`grid ${isTablet ? "grid-cols-[200px_1fr]" : isMobile ? "" : "grid-cols-1"}`}>
            {/* Categories - Vertical for tablet, horizontal for mobile and desktop */}
            {isTablet ? (
              // Tablet view - vertical categories on left
              <div className="border-r overflow-auto p-2">
                <div className="space-y-2">
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className="w-full justify-start h-auto py-2"
                      onClick={() => handleCategorySelect(category)}
                      disabled={isCategoryLoading}
                    >
                      {isCategoryLoading && selectedCategory === category ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        getCategoryIcon(category)
                      )}
                      <span className="ml-2 capitalize text-sm truncate">{category}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              // Mobile or desktop view - horizontal categories
              <div className="p-4 border-b">
                <div className={`flex flex-wrap gap-2 ${isMobile ? "" : "grid grid-cols-10"}`}>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={`flex-shrink-0 h-auto py-2 ${isMobile ? "flex-grow" : ""}`}
                      onClick={() => handleCategorySelect(category)}
                      disabled={isCategoryLoading}
                    >
                      {isCategoryLoading && selectedCategory === category ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        getCategoryIcon(category)
                      )}
                      <span className="ml-1 capitalize text-xs sm:text-sm truncate">{category}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className={`grid ${isMobile ? "" : !isTablet ? "grid-cols-[2fr_1fr]" : ""} h-full`}>
              <CardContent className="p-6 overflow-auto">
                <div
                  className={`grid grid-cols-1 ${
                    isMobile
                      ? "sm:grid-cols-2"
                      : isTablet
                        ? "grid-cols-2"
                        : "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  } gap-4`}
                >
                  {isCategoryLoading ? (
                    <div className="col-span-full flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : menuItems.length > 0 ? (
                    menuItems.map((item) => {
                      const quantity = item.quantity || 0
                      const isSelected = quantity > 0

                      return (
                        <div
                          key={item.id}
                          className={`border rounded-md p-4 ${isSelected ? "border-blue-500 bg-blue-50" : ""}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{item.name}</h3>
                              <p className="text-gray-500">{formatItemPrice(item.price)}</p>
                            </div>
                            <Badge variant="outline" className="capitalize">
                              {item.category}
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(item, -1)}
                                disabled={!isSelected}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">{quantity}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleQuantityChange(item, 1)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                            {isSelected && (
                              <div className="text-blue-600 font-medium">{formatItemPrice(item.price * quantity)}</div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="col-span-full text-center py-12 text-gray-500">
                      {searchQuery ? "No items match your search" : "No items in this category"}
                    </div>
                  )}
                </div>
              </CardContent>

              {/* Selected Items Panel - Now on the right side on larger screens */}
              {!isMobile && !isTablet && orderItems.length > 0 && (
                <div className="border-l overflow-auto">
                  <div className="p-3 bg-gray-50 border-b sticky top-0 z-10">
                    <div className="font-medium flex items-center">
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Selected Items ({orderItems.length})
                    </div>
                  </div>

                  <div className="p-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {getGroupedOrderItems().map(({ menuItem, items }) => (
                      <div key={menuItem.id} className="mb-4 last:mb-0">
                        <div className="font-medium flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            {getCategoryIcon(menuItem.category)}
                            <span>{menuItem.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {items.length} × {formatItemPrice(menuItem.price)}
                          </span>
                        </div>

                        <div className="mt-2 space-y-2">
                          {items.map((item, index) => (
                            <div key={item.id} className="border rounded-md p-2 bg-gray-50 flex flex-col">
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium">Item #{index + 1}</div>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => toggleAllergySelector(item.id)}
                                  >
                                    <AlertTriangle className="h-3 w-3 text-amber-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => {
                                      const newNotes = window.prompt("Special instructions:", item.notes || "")
                                      if (newNotes !== null) {
                                        handleItemNotesChange(item.id, newNotes)
                                      }
                                    }}
                                  >
                                    <MessageSquare className="h-3 w-3 text-blue-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                    onClick={() => handleRemoveOrderItem(item.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Allergy selector */}
                              {activeAllergyItem === item.id && (
                                <div className="mt-2 p-2 border rounded-md bg-white">
                                  <div className="text-xs font-medium mb-1">Select Allergies:</div>
                                  <div className="flex flex-wrap gap-1">
                                    {COMMON_ALLERGIES.map((allergy) => {
                                      const isSelected = item.allergies.includes(allergy)
                                      return (
                                        <Badge
                                          key={allergy}
                                          variant={isSelected ? "default" : "outline"}
                                          className={
                                            isSelected
                                              ? "cursor-pointer bg-red-100 hover:bg-red-200 text-red-800 border-red-200 text-xs"
                                              : "cursor-pointer hover:bg-gray-100 text-xs"
                                          }
                                          onClick={() => handleAllergyToggle(item.id, allergy)}
                                        >
                                          {allergy}
                                        </Badge>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Display allergies and notes */}
                              {item.allergies.length > 0 && activeAllergyItem !== item.id && (
                                <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  <span>{item.allergies.join(", ")}</span>
                                </div>
                              )}

                              {item.notes && (
                                <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  <span className="truncate">{item.notes}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Selected Items - Below the items grid */}
          {(isMobile || isTablet) && orderItems.length > 0 && (
            <div className="border-t">
              <div
                className="p-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                onClick={() => setShowSelectedItems(!showSelectedItems)}
              >
                <div className="font-medium flex items-center">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Selected Items ({orderItems.length})
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {showSelectedItems ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {showSelectedItems && (
                <div className="p-3 max-h-60 overflow-y-auto">
                  {getGroupedOrderItems().map(({ menuItem, items }) => (
                    <div key={menuItem.id} className="mb-3 last:mb-0">
                      <div className="font-medium flex items-center justify-between">
                        <div>{menuItem.name}</div>
                        <span className="text-sm text-gray-500">
                          {items.length} × {formatItemPrice(menuItem.price)}
                        </span>
                      </div>

                      <div className="mt-2 space-y-2">
                        {items.map((item, index) => (
                          <div key={item.id} className="border rounded-md p-2 bg-gray-50 flex flex-col">
                            <div className="flex justify-between items-center">
                              <div className="text-sm font-medium">Item #{index + 1}</div>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => toggleAllergySelector(item.id)}
                                >
                                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => {
                                    const newNotes = window.prompt("Special instructions:", item.notes || "")
                                    if (newNotes !== null) {
                                      handleItemNotesChange(item.id, newNotes)
                                    }
                                  }}
                                >
                                  <MessageSquare className="h-3 w-3 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                  onClick={() => handleRemoveOrderItem(item.id)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Allergy selector */}
                            {activeAllergyItem === item.id && (
                              <div className="mt-2 p-2 border rounded-md bg-white">
                                <div className="text-xs font-medium mb-1">Select Allergies:</div>
                                <div className="flex flex-wrap gap-1">
                                  {COMMON_ALLERGIES.map((allergy) => {
                                    const isSelected = item.allergies.includes(allergy)
                                    return (
                                      <Badge
                                        key={allergy}
                                        variant={isSelected ? "default" : "outline"}
                                        className={
                                          isSelected
                                            ? "cursor-pointer bg-red-100 hover:bg-red-200 text-red-800 border-red-200 text-xs"
                                            : "cursor-pointer hover:bg-gray-100 text-xs"
                                        }
                                        onClick={() => handleAllergyToggle(item.id, allergy)}
                                      >
                                        {allergy}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Display allergies and notes */}
                            {item.allergies.length > 0 && activeAllergyItem !== item.id && (
                              <div className="mt-1 text-xs text-red-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                <span>{item.allergies.join(", ")}</span>
                              </div>
                            )}

                            {item.notes && (
                              <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span className="truncate">{item.notes}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <CardFooter className="p-4 border-t bg-gray-50">
            <div className="flex justify-between items-center w-full">
              <div className="text-lg font-bold">Total: {formatItemPrice(calculateTotal())}</div>
              <Button className="gap-2" onClick={() => setIsRecapMode(true)} disabled={orderItems.length === 0}>
                <ClipboardList className="h-4 w-4 mr-2" />
                Review & Confirm
              </Button>
            </div>
          </CardFooter>
        </>
      )}
    </Card>
  )
}
