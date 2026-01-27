"use client";

import { useCurrencyFormatter } from "@frontend/contexts/restaurant-config";
import { cn } from "@frontend/lib/utils";
import { AlertCircle, Edit2, Minus, Plus, Trash2 } from "lucide-react";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { useState } from "react";
import { Badge } from "@/frontend/app/ui/badge";
import { Button } from "@/frontend/app/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/frontend/app/ui/dialog";
import { Textarea } from "@/frontend/app/ui/textarea";
import {
  type CustomItem,
  type GroupedBasketItem,
  getItemPrice,
  type MenuDerivedItem,
  useBasket,
} from "../contexts/basket";
import type { Allergen, MenuItem } from "../hook";

export interface BasketItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  menuItems: MenuItem[];
  allergens: Allergen[];
}

export const BasketItems = ({
  allergens,
  menuItems,
  className,
  ...props
}: BasketItemsProps) => {
  const formatCurrency = useCurrencyFormatter();
  const getItemName = (item: MenuDerivedItem | CustomItem) => {
    if (item.menuItemId !== undefined) {
      return (
        menuItems.find((mi) => mi.id === item.menuItemId)?.name ||
        "Unknown Item"
      );
    }
    return item.nameOverride;
  };

  const { items, removeItem, setItemAllergenIds, setItemNotes, addItem } =
    useBasket();

  const [editingItem, setEditingItem] = useState<{
    itemId: string;
    item: GroupedBasketItem;
    allergenIds: string[];
    notes: string;
    quantity: number;
    maxQuantity: number;
  } | null>(null);

  const openEditDialog = (itemId: string, item: GroupedBasketItem) => {
    setEditingItem({
      itemId,
      item,
      allergenIds: item.allergenIds,
      notes: item.notes || "",
      quantity: 1,
      maxQuantity: item.count,
    });
  };

  const decrementQuantity = () => {
    setEditingItem((prev) => {
      return !prev
        ? null
        : {
            ...prev,
            quantity: Math.max(1, prev.quantity - 1),
          };
    });
  };

  const incrementQuantity = () => {
    setEditingItem((prev) => {
      return !prev
        ? null
        : {
            ...prev,
            quantity: Math.min(prev.maxQuantity, prev.quantity + 1),
          };
    });
  };

  // Toggle allergen in edit dialog
  const toggleAllergen = (allergenId: string) => {
    setEditingItem((prev) => {
      return !prev
        ? null
        : {
            ...prev,
            allergenIds: prev?.allergenIds.includes(allergenId)
              ? prev.allergenIds.filter((id) => id !== allergenId)
              : [...(prev?.allergenIds || []), allergenId],
          };
    });
  };

  const setEditedNotes = (notes: string) => {
    setEditingItem((prev) => {
      return !prev
        ? null
        : {
            ...prev,
            notes,
          };
    });
  };

  const saveEditedItem = () => {
    const editingGroup = items.find((item) => item.key === editingItem?.itemId);
    if (!editingItem || !editingGroup) return;

    const itemIndexes = editingGroup.itemIndexes.slice(0, editingItem.quantity);

    itemIndexes.forEach((index) => {
      setItemAllergenIds(index, editingItem.allergenIds);
      setItemNotes(index, editingItem.notes);
    });
    setEditingItem(null);
  };

  return (
    <>
      <div {...props} className={cn(className)}>
        {items.map((item) => (
          <div
            key={item.key}
            className="border rounded-md p-4 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-medium text-base">
                    {getItemName(item.item)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(getItemPrice(menuItems, item.item))} each
                  </div>
                </div>
              </div>

              {/* Quantity controls and subtotal */}
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg mb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() => removeItem(item.key)}
                  >
                    {item.count === 1 ? (
                      <Trash2 className="h-5 w-5" />
                    ) : (
                      <Minus className="h-5 w-5" />
                    )}
                  </Button>
                  <div className="text-2xl font-bold min-w-[40px] text-center">
                    {item.count}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full"
                    onClick={() =>
                      addItem({
                        allergenIds: item.allergenIds,
                        item: item.item,
                        category: item.category,
                        notes: item.notes,
                      })
                    }
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
                <div className="font-bold text-lg">
                  {formatCurrency(
                    getItemPrice(menuItems, item.item) * item.count,
                  )}
                </div>
              </div>

              {/* Item details summary */}
              <div className="mt-3 space-y-2">
                {/* Allergen summary */}
                {item.allergenIds.length > 0 && (
                  <div className="flex items-center text-sm text-red-600 bg-red-50 p-2 rounded-md">
                    <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>
                      Allergies:{" "}
                      {item.allergenIds
                        .map((id) => allergens.find((a) => a.id === id)?.name)
                        .join(", ")}
                    </span>
                  </div>
                )}

                {/* Notes summary */}
                {item.notes && (
                  <div className="text-sm bg-gray-50 p-2 rounded-md">
                    <span className="font-medium">Notes:</span> {item.notes}
                  </div>
                )}
              </div>
            </div>
            {/* Edit button */}
            <Button
              variant="outline"
              className="w-full h-12 mt-3 text-base flex items-center justify-center self-end"
              onClick={() => openEditDialog(item.key, item)}
            >
              <Edit2 className="h-5 w-5 mr-2" />
              Edit Item
            </Button>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingItem !== null}
        onOpenChange={(open) => !open && setEditingItem(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Customize {editingItem && getItemName(editingItem.item.item)}
            </DialogTitle>
          </DialogHeader>

          {/* Quantity Section - Prominently displayed at the top */}
          <div className="bg-muted/30 p-4 rounded-lg border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">How many?</h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full text-lg"
                  onClick={decrementQuantity}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <div className="text-2xl font-bold min-w-[40px] text-center tabular-nums">
                  {editingItem?.quantity}
                  <span className="text-sm font-normal">
                    {" "}
                    / {editingItem?.maxQuantity}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-12 w-12 rounded-full text-lg"
                  onClick={incrementQuantity}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Allergens Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Allergies</h3>
            <div className="flex flex-wrap gap-2">
              {allergens.map((allergen) => (
                <Badge
                  key={allergen.id}
                  variant={
                    editingItem?.allergenIds.includes(allergen.id)
                      ? "default"
                      : "outline"
                  }
                  className={cn(
                    "cursor-pointer text-base py-2 px-4 h-10",
                    editingItem?.allergenIds.includes(allergen.id)
                      ? "bg-red-100 hover:bg-red-200 text-red-800 hover:text-red-900 border-red-200"
                      : "hover:bg-muted",
                  )}
                  onClick={() => toggleAllergen(allergen.id)}
                >
                  <DynamicIcon
                    className="h-6 w-6"
                    name={allergen.icon as IconName}
                  />
                  {allergen.name}
                </Badge>
              ))}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Notes</h3>
            <Textarea
              value={editingItem?.notes}
              onChange={(e) => setEditedNotes(e.target.value)}
              placeholder="Add special instructions..."
              className="text-base min-h-[100px]"
            />
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 h-14 text-base"
              onClick={() => setEditingItem(null)}
            >
              Cancel
            </Button>
            <Button className="flex-1 h-14 text-base" onClick={saveEditedItem}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
