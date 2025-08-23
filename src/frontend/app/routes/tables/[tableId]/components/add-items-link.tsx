"use client";

import { cn } from "../../../../lib/utils";
import { Button, buttonVariants } from "../../../../components/ui/button";
import { Lock, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";
import { Link } from "wouter";

export const AddItemsLink = ({
  tableId,
  tabId,
  locked,
}: {
  tableId: string;
  tabId: string;
  locked: boolean;
}) => {
  return locked ? (
    <Tooltip defaultOpen>
      <TooltipTrigger asChild>
        <Button disabled variant="outline" size="sm" className={"h-8 gap-1"}>
          <Lock className="h-3.5 w-3.5" />
          Add Items
        </Button>
      </TooltipTrigger>
      <TooltipContent className="border bg-yellow-50 text-yellow-600 border-yellow-400 [--tooltip-color:var(--color-yellow-50)] [--tooltip-border:var(--color-yellow-400)]">
        <p>Create a new tab to add items</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Link
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-8 gap-1"
      )}
      href={`/tables/${tableId}/tabs/${tabId}/add-items`}
    >
      <Plus className="h-3.5 w-3.5" />
      Add Items
    </Link>
  );
};
