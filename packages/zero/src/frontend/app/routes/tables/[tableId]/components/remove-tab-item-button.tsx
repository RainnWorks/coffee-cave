"use client";

import { Button } from "../../../../components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useTypedZero } from "../../../../lib/zero";
import { useLocation } from "wouter";

export interface RemoveTabItemButtonProps {
  tableId: string;
  tabId: string;
  tabItemId: string;
  disabled: boolean;
}

export const RemoveTabItemButton = ({
  tableId,
  tabId,
  tabItemId,
  disabled,
}: RemoveTabItemButtonProps) => {
  const z = useTypedZero();
  const [location, setLocation] = useLocation();
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  // Create a new tab
  const handleRemoveItem = async () => {
    if (isRemovingItem) return;
    setIsRemovingItem(true);
    try {
      await z.mutate.tab_item.delete({ id: tabItemId });
      setLocation(`/tables/${tableId}?tid=${tabId}`);
    } catch (error) {
      console.error("Error creating tab:", error);
      toast.error("Failed to create new tab");
    } finally {
      setIsRemovingItem(false);
    }
  };
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
      onClick={() => handleRemoveItem()}
      aria-label={`Remove item`}
      disabled={disabled || isRemovingItem}
    >
      {isRemovingItem ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </Button>
  );
};
