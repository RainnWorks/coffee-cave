import { cn } from "../../../../lib/utils";
import { Button } from "../../../../components/ui/button";
import { DoorClosed, DoorClosedLocked, Loader } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../../components/ui/tooltip";
import { useState } from "react";
import { useTypedZero } from "../../../../lib/zero";
import { useLocation } from "wouter";

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
      await z.mutate.restaurant_table.update({
        id: tableId,
        closed: true,
      });

      setLocation(`/tables`);
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
      {isLoading ? (
        <Loader className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <DoorClosed className="h-3.5 w-3.5" />
      )}
      Close Table
    </Button>
  );
};
