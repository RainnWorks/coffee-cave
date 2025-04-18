"use client";

import { Button } from "@/components/ui/button";
import { useManifest } from "@/contexts/manifest-client";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export interface RemoveTabItemButtonProps {
  tableId: number;
  tabId: number;
  tabItemId: number;
  disabled: boolean;
}

export const RemoveTabItemButton = ({
  tableId,
  tabId,
  tabItemId,
  disabled,
}: RemoveTabItemButtonProps) => {
  const router = useRouter();
  const { client } = useManifest();
  const [isRemovingItem, setIsRemovingItem] = useState(false);

  // Create a new tab
  const handleRemoveItem = async () => {
    if (isRemovingItem) return;
    setIsRemovingItem(true);
    try {
      await client.tabItems.delete(tabItemId);
      // Navigate to add items page
      router.push(`/tables/${tableId}?tid=${tabId}`);
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
