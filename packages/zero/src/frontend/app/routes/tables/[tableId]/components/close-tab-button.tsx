"use client";

import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { CopyCheck, CopySlash, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";
import { useState } from "react";
import { useTypedZero } from "../../../../lib/zero";
import { useLocation } from "wouter";

export const CloseTabButton = ({
  tableId,
  tabId,
  locked,
}: {
  tableId: string;
  tabId: string;
  locked: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useLocation();

  const z = useTypedZero();
  const onClick = async () => {
    setIsLoading(true);
    try {
      await z.mutate.tab.update({
        id: tabId,
        closed: true,
      });

      const table = await z.query.restaurant_table
        .where("id", "=", tableId)
        .related("tabs")
        .one()
        .run();

      const firstUnclosedTabId = table?.tabs?.find((tab) => !tab.closedAt)?.id;
      setLocation(
        `/tables/${tableId}` +
          (firstUnclosedTabId ? `?tid=${firstUnclosedTabId}` : "")
      );
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
