import type { DateTime } from "luxon";

const hashCode = (str: string): number => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const chr = str.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
};

export interface GroupableItem {
  addedAt?: DateTime | null;
  priceOverride?: number | null;
  nameOverride?: string | null;
  menuItemId?: string | null;
  allergenIds?: string[] | null;
  notes?: string | null;
  menuItem?: {
    id: string;
  } | null;
  item?: {
    menuItemId?: string | null;
  } | null;
}

export const generateItemId = ({
  allergenIds,
  menuItemId,
  nameOverride,
  priceOverride,
  notes,
  menuItem,
  item,
}: GroupableItem): string => {
  const itemKey = menuItemId ?? item?.menuItemId ?? menuItem?.id ?? undefined;
  const allergenKey =
    (allergenIds?.length ?? 0) > 0
      ? `allergenIds(${allergenIds!.sort().join(",")})`
      : undefined;

  const notesKey = notes ? `notes(${hashCode(notes)})` : undefined;
  const priceOverrideKey = priceOverride
    ? `price(${priceOverride})`
    : undefined;
  const nameOverrideKey = nameOverride ? `name(${nameOverride})` : undefined;
  return [itemKey, allergenKey, notesKey, priceOverrideKey, nameOverrideKey]
    .filter(Boolean)
    .join("-");
};

export type GroupedItem<T extends object> = T & {
  key: string;
  itemIndexes: number[];
  count: number;
  items: T[];
};

export const groupItems = <T extends object>(
  items: T[],
): { [key: string]: GroupedItem<T> } => {
  const result =
    items.reduce(
      (acc, item, i) => {
        const itemKey = generateItemId(item);
        const coercedItem = item as GroupableItem;
        const existingItem = acc[itemKey] as
          | (GroupableItem & GroupedItem<T>)
          | undefined;
        return {
          ...acc,
          [itemKey]: {
            ...item,
            key: itemKey,
            itemIndexes: !existingItem ? [i] : [...existingItem.itemIndexes, i],
            addedAt:
              !existingItem ||
              !existingItem.addedAt ||
              !coercedItem.addedAt ||
              existingItem.addedAt > coercedItem.addedAt
                ? coercedItem.addedAt
                : existingItem.addedAt,
            items: !existingItem ? [item] : [...existingItem.items, item],
            count: (existingItem?.count || 0) + 1,
          },
        };
      },
      {} as { [key: string]: GroupedItem<T> },
    ) ?? {};
  return result;
};
