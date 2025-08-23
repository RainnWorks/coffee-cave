"use client";

import { Button } from "../../../../components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "../../../../lib/utils";
import { useTypedZero } from "../../../../lib/zero";
import { generateId } from "../../../../../../utils/ids";
import { useLocation } from "wouter";

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
      await z.mutate.tab.insert({
        id: tabId,
        createdAt: Date.now(),
        tableID: tableId,
      });
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
