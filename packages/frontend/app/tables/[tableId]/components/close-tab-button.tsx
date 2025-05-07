"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CopyCheck, CopySlash, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { closeTab } from "../actions/close-tab";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const CloseTabButton = ({
  tableId,
  tabId,
  locked,
}: {
  tableId: number;
  tabId: number;
  locked: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onClick = async () => {
    setIsLoading(true);
    try {
      const result = await closeTab(tableId, tabId);
      if (result.error) {
        toast.error(result.error);
      } else {
        const firstUnclosedTabId = result.result?.table?.result?.tabs?.find(
          (tab) => !tab.closedAt
        )?.id;
        router.push(
          `/tables/${tableId}` +
            (firstUnclosedTabId ? `?tid=${firstUnclosedTabId}` : "")
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return locked ? (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button disabled variant="outline" size="sm" className={"h-8 gap-1"}>
          <CopySlash className="h-3.5 w-3.5" />
          Close Tab
        </Button>
      </TooltipTrigger>
      <TooltipContent className="border bg-gray-50 text-gray-600 border-gray-400 [--tooltip-color:var(--color-gray-50)] [--tooltip-border:var(--color-gray-400)]">
        <p>All items must be paid to close the tab</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Button variant="outline" className={cn("h-8 gap-1")} onClick={onClick}>
      {isLoading ? (
        <Loader className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <CopyCheck className="h-3.5 w-3.5" />
      )}
      Close Tab
    </Button>
  );
};
