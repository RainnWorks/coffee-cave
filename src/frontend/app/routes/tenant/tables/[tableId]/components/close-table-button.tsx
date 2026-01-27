import { cn } from "@frontend/lib/utils";
import { useTypedZero } from "@frontend/zero";
import { DoorClosed, DoorClosedLocked, Loader } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/frontend/app/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/frontend/app/ui/tooltip";
import { mutators } from "@/mutators";

export const CloseTableButton = ({
  tableId,
  locked,
}: {
  tableId: string;
  locked: boolean;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const [showTooltip, setShowTooltip] = useState(false);

  const z = useTypedZero();

  const onClick = async () => {
    setIsLoading(true);
    try {
      // Close table (automatically closes all open tabs first)
      await z.mutate(mutators.restaurantTable.close({ id: tableId }));
      setLocation(`/tables`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return locked ? (
    <Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
      <TooltipTrigger>
        <Button
          onClick={() => setShowTooltip(true)}
          disabled
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
      {isLoading ? (
        <Loader className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <DoorClosed className="h-3.5 w-3.5" />
      )}
      Close Table
    </Button>
  );
};
