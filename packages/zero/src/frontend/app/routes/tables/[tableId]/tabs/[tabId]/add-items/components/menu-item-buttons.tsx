import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { OrderItem, useBasket } from "../contexts/basket";
import { Category, MenuItem } from "@/lib/manifest/types";

export interface AddMenuItemButtonProps {
  category: Category;
  menuItem: MenuItem;
}

export const AddMenuItemButton = ({ category, menuItem }: AddMenuItemButtonProps) => {
  const orderItem: OrderItem = {
    item: {
      menuItemId: menuItem.id,
    },
    category,
    allergenIds: [],
  };
  const { addItem, removeItem, items } = useBasket();
  const selectedItem = items.find(
    (item) => item.item.menuItemId === menuItem.id
  );
  const isSelected = !!selectedItem;
  return (
    <div className="flex flex-1 justify-between items-center">
      <Button
        variant="outline"
        size="sm"
        className="h-12 w-12 p-0"
        onClick={() => removeItem(orderItem)}
        disabled={!isSelected}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center">{selectedItem?.count ?? 0}</span>
      <Button
        variant="outline"
        size="sm"
        className="h-12 w-12 p-0"
        onClick={() => addItem(orderItem)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
