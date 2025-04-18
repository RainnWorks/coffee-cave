import { Badge } from "@/components/ui/badge";
import { Allergen } from "@/lib/manifest/types";
import { cn } from "@/lib/utils";

export interface AllergenSelectorProps extends React.ComponentProps<"div"> {
  selectedAllergenIds: number[];
  allergens: Allergen[];
  onToggleAllergen: (allergenId: number) => void;
}

export const AllergenSelector = ({
  selectedAllergenIds,
  allergens,
  onToggleAllergen,
  className,
  ...divProps
}: AllergenSelectorProps) => {
  return (
    <div
      {...divProps}
      className={cn("mt-2 p-2 border rounded-md bg-white", className)}
    >
      <div className="text-xs font-medium mb-1">Select Allergies:</div>
      <div className="flex flex-wrap gap-1">
        {allergens.map((allergen) => {
          const isSelected = selectedAllergenIds.includes(allergen.id);
          return (
            <Badge
              key={allergen.id}
              variant={isSelected ? "default" : "outline"}
              className={
                isSelected
                  ? "cursor-pointer bg-red-100 hover:bg-red-200 text-red-800 border-red-200 text-xs"
                  : "cursor-pointer hover:bg-gray-100 text-xs"
              }
              onClick={() => onToggleAllergen(allergen.id)}
            >
              {allergen.name}
            </Badge>
          );
        })}
      </div>
    </div>
  );
};
