"use client";

import { Button } from "@/components/ui/button";
import { useManifest } from "@/contexts/manifest-client";
import { Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";

export const CreateTabButton = ({
  tableId,
  className,
  ...props
}: { tableId: number } & React.ComponentProps<typeof Button>) => {
  const router = useRouter();
  const { client } = useManifest();
  const [isCreatingTab, setIsCreatingTab] = useState(false);

  // Create a new tab
  const handleCreateNewTab = async () => {
    setIsCreatingTab(true);
    try {
      const { error, errorMessage, result } = await client.tabs.create({
        table: { id: tableId },
        createdAt: DateTime.now().toISO(),
      });
      if (error || errorMessage || !result) {
        toast.error(errorMessage ?? "Failed to create new tab");
        return;
      }
      // Navigate to add items page
      router.push(`/tables/${tableId}/tabs/${result.id}/add-items`);
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
