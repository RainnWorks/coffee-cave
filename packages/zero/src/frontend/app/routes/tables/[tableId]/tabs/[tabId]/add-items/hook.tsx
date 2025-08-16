import { useTypedZero } from "@/frontend/app/lib/zero";
import { useQuery } from "@rocicorp/zero/react";

export function useItemsQuery() {
  const z = useTypedZero();

  const [categories, { type: categoriesType }] = useQuery(
    z.query.category.related("menuItems", (q) => q.related("menuItem"))
  );

  const menuItems = Array.from(
    new Map(
      categories.flatMap((category) =>
        category.menuItems
          .flatMap((menuItem) => menuItem.menuItem)
          .filter((x) => !!x)
          .map((item) => [item.id, item])
      )
    ).values()
  );

  const [allergens, { type: allergensType }] = useQuery(z.query.allergen);

  return [
    {
      categories,
      menuItems,
      allergens,
    },
    { categoriesType, allergensType },
  ];
}

export type MenuItem = Exclude<
  ReturnType<typeof useItemsQuery>[0]["menuItems"],
  undefined
>[number];

export type Allergen = Exclude<
  ReturnType<typeof useItemsQuery>[0]["allergens"],
  undefined
>[number];

export type Category = Exclude<
  ReturnType<typeof useItemsQuery>[0]["categories"],
  undefined
>[number];
