"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DoorClosed,
  DoorClosedLocked,
  Loader,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { closeTable } from "../actions/close-table";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export const CloseTableButton = ({
  tableId,
  locked,
}: {
  tableId: number;
  locked: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();

  const [showTooltip, setShowTooltip] = useState(false);

  const onClick = async () => {
    setIsLoading(true);
    try {
      const result = await closeTable(tableId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setIsRedirecting(true);
        router.push(`/tables`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return locked ? (
    <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
      <TooltipTrigger asChild>
        <Button
          onClick={() => setShowTooltip(true)}
          variant="outline"
          size="sm"
          className={"gap-1 h-10"}
        >
          <DoorClosedLocked className="h-3.5 w-3.5" />
          Close Table
        </Button>
      </TooltipTrigger>
      <TooltipContent className="border bg-gray-50 text-gray-600 border-gray-400 [--tooltip-color:var(--color-gray-50)] [--tooltip-border:var(--color-gray-400)]">
        <p>All items must be paid to close the tab</p>
      </TooltipContent>
    </Tooltip>
  ) : (
    <Button variant="outline" className={cn("gap-1 h-10")} onClick={onClick}>
      {isLoading || isRedirecting ? (
        <Loader className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <DoorClosed className="h-3.5 w-3.5" />
      )}
      Close Table
    </Button>
  );
};
