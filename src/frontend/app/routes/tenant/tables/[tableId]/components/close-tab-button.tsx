"use client";

import { cn } from "@frontend/lib/utils";
import { useTypedZero } from "@frontend/zero";
import { CopyCheck, CopySlash } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/app/ui/tooltip";
import { mutators } from "@/mutators";
import { queries } from "@/queries";

interface CloseTabButtonProps {
  tableId: string;
  tabId: string;
  locked: boolean;
}

export const CloseTabButton = ({
  tableId,
  tabId,
  locked,
}: CloseTabButtonProps) => {
  const [, setLocation] = useLocation();

  const z = useTypedZero();
  const onClick = async () => {
    // Close the tab using mutator
    await z.mutate(mutators.tab.update({ id: tabId, closed: true }));

    // Get table with tabs to navigate to next open tab
    const table = await z.run(queries.tables.byIdWithTabs({ id: tableId }));

    const openTabs = table?.tabs.filter((tab) => !tab.closedAt);
    if (openTabs?.length === 0) {
      setLocation(`/tables/${tableId}`);
    } else {
      const newTabId = openTabs?.[0]?.id;
      setLocation(`/tables/${tableId}?tid=${newTabId}`);
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
      <CopyCheck className="h-3.5 w-3.5" />
      Close Tab
    </Button>
  );
};
