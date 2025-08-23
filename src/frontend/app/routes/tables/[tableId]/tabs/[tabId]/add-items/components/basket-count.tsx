"use client";

import { useBasket } from "../contexts/basket";

export interface BasketCountProps {
  additionalText?: string;
  additionalTextPlural?: string;
}

export const BasketCount = ({
  additionalText,
  additionalTextPlural,
}: BasketCountProps) => {
  const { count } = useBasket();
  return (
    <span>
      {count}
      {count === 1 ? additionalText : additionalTextPlural}
    </span>
  );
};
