"use client";

import { cn } from "@frontend/lib/utils";
import { useTypedZero } from "@frontend/zero";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import { mutators } from "@/mutators";
import { generateId } from "@/utils/ids";

export const CreateTabButton = ({
  tableId,
  className,
  ...props
}: { tableId: string } & React.ComponentProps<typeof Button>) => {
  const [isCreatingTab, setIsCreatingTab] = useState(false);

  const z = useTypedZero();
  const [, setLocation] = useLocation();

  // Create a new tab
  const handleCreateNewTab = async () => {
    setIsCreatingTab(true);
    try {
      const tabId = generateId("tab");
      await z.mutate(
        mutators.tab.insert({
          id: tabId,
          tableID: tableId,
        }),
      );
      // Navigate to add items page
      setLocation(`/tables/${tableId}/tabs/${tabId}/add-items`);
    } catch (error) {
      console.error("Error creating tab:", error);
      toast.error("Failed to create new tab");
    } finally {
      setIsCreatingTab(false);
    }
  };

  return (
    <Button
      className={cn("gap-1 h-10", className)}
      {...props}
      onClick={handleCreateNewTab}
      disabled={isCreatingTab}
    >
      {isCreatingTab ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      {isCreatingTab ? "Creating..." : "New Tab"}
    </Button>
  );
};
