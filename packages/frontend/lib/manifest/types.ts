import { z } from "zod";
import { DateTime } from "luxon";

// Custom Zod schema for DateTime
export const dateTimeSchema = z.union([
  z.string().transform((dateStr) => {
    const parsed = DateTime.fromISO(dateStr);
    if (!parsed.isValid) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
    return parsed;
  }),
  z.custom<DateTime>(
    (val) => {
      return DateTime.isDateTime(val) && (val as DateTime).isValid;
    },
    {
      message: "Invalid DateTime object",
    }
  ),
]);

export const RestaurantConfigSchema = z.object({
  name: z.string(),
  currencyCode: z.string().nonempty(),
  currencyLocale: z.string().nonempty(),
  timeZone: z.string().nonempty(),
  primaryColor: z.string().nonempty(),
  secondaryColor: z.string().nonempty(),
});

export const CategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  icon: z.string(),
});
export type Category = z.infer<typeof CategorySchema>;

// Forward reference for AllergySchema since it's used in MenuItem
export const AllergenSchema = z.lazy(() =>
  z.object({
    id: z.number(),
    name: z.string(),
    icon: z.string(),
  })
);
export type Allergen = z.infer<typeof AllergenSchema>;

export const MenuItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  notes: z.string().optional(),
  allergens: z.array(AllergenSchema).optional(),
});
export type MenuItem = z.infer<typeof MenuItemSchema>;

export const MenuItemWithCategorySchema = MenuItemSchema.extend({
  categories: z.array(CategorySchema),
});
export type MenuItemWithCategory = z.infer<typeof MenuItemWithCategorySchema>;

export const TabItemSchema = z.object({
  id: z.number(),
  allergyRestrictions: z.array(AllergenSchema).optional(),
  notes: z.string().optional().nullable(),
  nameOverride: z.string().optional().nullable(),
  priceOverride: z.number().optional(),
  createdAt: dateTimeSchema,
});

export const TabItemWithMenuItemSchema = TabItemSchema.extend({
  menuItem: MenuItemWithCategorySchema.optional(),
});

export type TabItemWithMenuItem = z.infer<typeof TabItemWithMenuItemSchema>;

export const CategoryWithMenuItemsSchema = CategorySchema.extend({
  menuItems: z.array(MenuItemSchema),
});
export type CategoryWithMenuItems = z.infer<typeof CategoryWithMenuItemsSchema>;

export type TabItem = z.infer<typeof TabItemSchema>;

export const TabSchema = z.object({
  id: z.number(),
  tabItems: z.array(TabItemWithMenuItemSchema),
  createdAt: dateTimeSchema,
});

export type RestaurantConfig = z.infer<typeof RestaurantConfigSchema>;

export const StaffSchema = z.object({
  id: z.number(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

export type Staff = z.infer<typeof StaffSchema>;



export type Tab = z.infer<typeof TabSchema>;

export const PaymentSchema = z.object({
  id: z.number(),
  amount: z.number(),
  method: z.enum(["cash", "card", "other"]),
  note: z.string().optional(),
  tabItemsPaid: z.array(z.object({ id: z.number() })),
  createdAt: dateTimeSchema,
});

export type Payment = z.infer<typeof PaymentSchema>;

export const TableSchema = z.object({
  id: z.number(),
  name: z.string(),
  tabs: z.array(TabSchema).optional(),
  seats: z.number(),
  createdAt: dateTimeSchema,
  payments: z.array(PaymentSchema).optional(),
  notes: z.string().optional().nullable(),
});

export type Table = z.infer<typeof TableSchema>;
