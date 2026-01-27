import "dmno/auto-inject-globals";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createHashAndSalt } from "../src/utils/auth";
import * as schema from "../drizzle/schema";

const pool = new Pool({ connectionString: DMNO_CONFIG.ZERO_UPSTREAM_DB });
const db = drizzle(pool, { schema });

// Deterministic ID generator
let idCounter = 1;
const generateId = () => `seed_${String(idCounter++).padStart(3, "0")}`;

// Seeded random for deterministic tab/item generation
let seededRandom = 12345;
const nextRandom = () => {
  seededRandom = (seededRandom * 1103515245 + 12345) & 0x7fffffff;
  return seededRandom / 0x7fffffff;
};
const randomInt = (min: number, max: number) =>
  Math.floor(nextRandom() * (max - min + 1)) + min;

console.log("Starting seed process...");

try {
  const now = new Date();

  // ============================================================================
  // Create Tenant
  // ============================================================================
  const tenantId = generateId();
  const tenantSlug = "coffee-cave"; // lowercase, no spaces, URL-safe for subdomain
  await db.insert(schema.tenant).values({
    id: tenantId,
    name: "Coffee Cave",
    slug: tenantSlug,
    createdAt: now,
    updatedAt: now,
  });
  console.log(`Created tenant: Coffee Cave (${tenantId}, slug: ${tenantSlug})`);

  // ============================================================================
  // Create Restaurant Settings
  // ============================================================================
  await db.insert(schema.restaurantSettings).values({
    id: generateId(),
    name: "Coffee Cave",
    currencyCode: "EUR",
    currencyLocale: "en-GB",
    primaryColor: "#6F4E37",
    secondaryColor: "#D4B996",
    timeZone: "Europe/Paris",
    coinsAndNotes:
      "1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,20000,50000",
    tenantId: tenantId,
  });
  console.log("Created restaurant settings for: Coffee Cave");

  // ============================================================================
  // Create Admin Principal with Password + PIN credentials
  // ============================================================================
  const adminPrincipalId = generateId();
  const adminPin = "1234";
  const adminPassword = "adminPassword123";

  // Create principal
  await db.insert(schema.principal).values({
    id: adminPrincipalId,
    kind: "human",
    displayName: "Admin User",
    globalCredVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  // Create PIN credential for tenant access
  const { hash: adminPinHash, salt: adminPinSalt } =
    await createHashAndSalt(adminPin);
  await db.insert(schema.pinCredential).values({
    id: generateId(),
    principalId: adminPrincipalId,
    tenantId: tenantId,
    staffCode: "001",
    pinHash: adminPinHash,
    pinSalt: adminPinSalt,
    createdAt: now,
  });

  // Create password credential for admin login
  const { hash: adminPasswordHash, salt: adminPasswordSalt } =
    await createHashAndSalt(adminPassword);
  await db.insert(schema.passwordCredential).values({
    id: generateId(),
    principalId: adminPrincipalId,
    email: "admin@coffeecave.com",
    passwordHash: adminPasswordHash,
    passwordSalt: adminPasswordSalt,
    createdAt: now,
  });

  // Grant admin role for tenant
  await db.insert(schema.roleGrant).values({
    id: generateId(),
    principalId: adminPrincipalId,
    scopeKind: "tenant",
    tenantId: tenantId,
    role: "admin",
    grantedAt: now,
  });

  console.log("Created admin principal: Admin User with password + PIN credentials");

  // ============================================================================
  // Create Staff Principal with PIN only
  // ============================================================================
  const staffPrincipalId = generateId();
  const staffPin = "5678";

  await db.insert(schema.principal).values({
    id: staffPrincipalId,
    kind: "human",
    displayName: "Staff Member",
    globalCredVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  const { hash: staffPinHash, salt: staffPinSalt } =
    await createHashAndSalt(staffPin);
  await db.insert(schema.pinCredential).values({
    id: generateId(),
    principalId: staffPrincipalId,
    tenantId: tenantId,
    staffCode: "002",
    pinHash: staffPinHash,
    pinSalt: staffPinSalt,
    createdAt: now,
  });

  // Grant staff role for tenant
  await db.insert(schema.roleGrant).values({
    id: generateId(),
    principalId: staffPrincipalId,
    scopeKind: "tenant",
    tenantId: tenantId,
    role: "staff",
    grantedAt: now,
  });

  console.log("Created staff principal: Staff Member with PIN credential");

  // ============================================================================
  // Create Platform Admin (global admin with email/password only)
  // ============================================================================
  const platformAdminId = generateId();
  const platformAdminPassword = "platformAdmin123";

  await db.insert(schema.principal).values({
    id: platformAdminId,
    kind: "human",
    displayName: "Platform Admin",
    globalCredVersion: 1,
    createdAt: now,
    updatedAt: now,
  });

  const { hash: platformPasswordHash, salt: platformPasswordSalt } =
    await createHashAndSalt(platformAdminPassword);
  await db.insert(schema.passwordCredential).values({
    id: generateId(),
    principalId: platformAdminId,
    email: "platform@coffeecave.com",
    passwordHash: platformPasswordHash,
    passwordSalt: platformPasswordSalt,
    createdAt: now,
  });

  // Grant platform_admin role (no tenantId - global scope)
  await db.insert(schema.roleGrant).values({
    id: generateId(),
    principalId: platformAdminId,
    scopeKind: "platform",
    role: "platform",
    grantedAt: now,
  });

  console.log("Created platform admin: Platform Admin with email/password");

  // ============================================================================
  // Create Allergens
  // ============================================================================
  console.log("\nCreating allergens...");

  const allergensData = [
    // EU Big 14
    { name: "Gluten", icon: "wheat" },
    { name: "Crustaceans", icon: "shrimp" },
    { name: "Eggs", icon: "egg" },
    { name: "Fish", icon: "fish" },
    { name: "Peanuts", icon: "bean" },
    { name: "Soybeans", icon: "bean" },
    { name: "Milk", icon: "milk" },
    { name: "Tree Nuts", icon: "nut" },
    { name: "Celery", icon: "leafy-green" },
    { name: "Mustard", icon: "flask-conical" },
    { name: "Sesame", icon: "flower-2" },
    { name: "Sulphites", icon: "flask-conical" },
    { name: "Lupin", icon: "flower" },
    { name: "Molluscs", icon: "shell" },
    // Dietaries
    { name: "Vegetarian", icon: "salad" },
    { name: "Vegan", icon: "vegan" },
    { name: "Gluten Free", icon: "wheat-off" },
    { name: "Dairy Free", icon: "milk-off" },
    { name: "Alcohol Free", icon: "wine-off" },
    { name: "Pork Free", icon: "ham" },
    { name: "Halal", icon: "moon-star" },
    { name: "Kosher", icon: "badge-check" },
  ];

  const allergenIds: Record<string, string> = {};
  for (const { name, icon } of allergensData) {
    const allergenId = generateId();
    await db.insert(schema.allergen).values({
      id: allergenId,
      name,
      icon,
      tenantId: tenantId,
    });
    allergenIds[name] = allergenId;
    console.log(`Created allergen: ${name} with icon: ${icon}`);
  }

  // ============================================================================
  // Create Categories
  // ============================================================================
  console.log("\nCreating menu categories...");

  const categoriesData = [
    { name: "Hot Drinks", icon: "coffee" },
    { name: "Cold Drinks", icon: "glass-water" },
    { name: "Pastries", icon: "croissant" },
    { name: "Breakfast", icon: "egg-fried" },
    { name: "Lunch", icon: "utensils" },
    { name: "Desserts", icon: "cake" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const { name, icon } of categoriesData) {
    const categoryId = generateId();
    await db.insert(schema.category).values({
      id: categoryId,
      name,
      icon,
      tenantId: tenantId,
    });
    categoryIds[name] = categoryId;
    console.log(`Created category: ${name}`);
  }

  // ============================================================================
  // Create Menu Items
  // ============================================================================
  console.log("\nCreating menu items...");

  // Shared menu items (appear in multiple categories)
  const sharedMenuItemsData = [
    {
      name: "Fresh Baked Croissant",
      price: 295,
      categories: ["Pastries", "Breakfast"],
      allergens: ["Gluten", "Eggs", "Milk"],
    },
    {
      name: "Seasonal Fruit Tart",
      price: 450,
      categories: ["Pastries", "Desserts"],
      allergens: ["Gluten", "Eggs", "Milk"],
    },
  ];

  // Category-specific menu items
  const menuItemsByCategory: Record<
    string,
    Array<{ name: string; price: number; allergens: string[] }>
  > = {
    "Hot Drinks": [
      { name: "Espresso", price: 250, allergens: [] },
      { name: "Cappuccino", price: 350, allergens: ["Milk"] },
      { name: "Americano", price: 300, allergens: [] },
      { name: "Flat White", price: 375, allergens: ["Milk"] },
      { name: "Mocha", price: 425, allergens: ["Milk"] },
      { name: "Hot Chocolate", price: 400, allergens: ["Milk"] },
    ],
    "Cold Drinks": [
      { name: "Iced Coffee", price: 375, allergens: [] },
      { name: "Iced Tea", price: 350, allergens: [] },
      { name: "Fresh Orange Juice", price: 400, allergens: [] },
      { name: "Sparkling Water", price: 250, allergens: [] },
    ],
    Pastries: [
      { name: "Pain au Chocolat", price: 325, allergens: ["Gluten", "Milk", "Eggs"] },
      { name: "Almond Croissant", price: 350, allergens: ["Gluten", "Milk", "Eggs", "Tree Nuts"] },
      { name: "Cinnamon Roll", price: 375, allergens: ["Gluten", "Milk", "Eggs"] },
    ],
    Breakfast: [
      { name: "Avocado Toast", price: 895, allergens: ["Gluten"] },
      { name: "Eggs Benedict", price: 1095, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Breakfast Burrito", price: 950, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Granola Bowl", price: 795, allergens: ["Milk", "Tree Nuts"] },
    ],
    Lunch: [
      { name: "Club Sandwich", price: 995, allergens: ["Gluten", "Eggs"] },
      { name: "Quinoa Salad", price: 895, allergens: [] },
      { name: "Soup of the Day", price: 595, allergens: ["Celery"] },
      { name: "Grilled Chicken Panini", price: 1050, allergens: ["Gluten"] },
      { name: "Roasted Vegetable Wrap", price: 895, allergens: ["Gluten"] },
    ],
    Desserts: [
      { name: "Chocolate Brownie", price: 425, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Cheesecake", price: 550, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Carrot Cake", price: 495, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Macarons (3pc)", price: 650, allergens: ["Eggs", "Tree Nuts"] },
    ],
  };

  // Track all created menu items for later use
  const createdMenuItems: Array<{ id: string; price: number }> = [];

  // Create shared menu items
  for (const item of sharedMenuItemsData) {
    const menuItemId = generateId();
    await db.insert(schema.menuItem).values({
      id: menuItemId,
      name: item.name,
      price: item.price,
      createdByID: adminPrincipalId,
      tenantId: tenantId,
    });
    createdMenuItems.push({ id: menuItemId, price: item.price });

    // Create category relationships
    for (const categoryName of item.categories) {
      await db.insert(schema.menuItemCategory).values({
        menuItemID: menuItemId,
        categoryID: categoryIds[categoryName],
      });
    }

    // Create allergen relationships
    for (const allergenName of item.allergens) {
      if (allergenIds[allergenName]) {
        await db.insert(schema.menuItemAllergen).values({
          menuItemID: menuItemId,
          allergenID: allergenIds[allergenName],
        });
      }
    }

    console.log(`Created shared menu item: ${item.name} in ${item.categories.join(", ")}`);
  }

  // Create category-specific menu items
  for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
    for (const item of items) {
      const menuItemId = generateId();
      await db.insert(schema.menuItem).values({
        id: menuItemId,
        name: item.name,
        price: item.price,
        createdByID: adminPrincipalId,
        tenantId: tenantId,
      });
      createdMenuItems.push({ id: menuItemId, price: item.price });

      // Create category relationship
      await db.insert(schema.menuItemCategory).values({
        menuItemID: menuItemId,
        categoryID: categoryIds[categoryName],
      });

      // Create allergen relationships
      for (const allergenName of item.allergens) {
        if (allergenIds[allergenName]) {
          await db.insert(schema.menuItemAllergen).values({
            menuItemID: menuItemId,
            allergenID: allergenIds[allergenName],
          });
        }
      }

      console.log(`Created menu item: ${item.name} in ${categoryName}`);
    }
  }

  // ============================================================================
  // Create Restaurant Tables
  // ============================================================================
  console.log("\nCreating restaurant tables...");

  const tablesData = [
    { name: "Table 1", seats: 2 },
    { name: "Table 2", seats: 4 },
    { name: "Table 3", seats: 6 },
  ];

  const createdTables: Array<{ id: string; name: string }> = [];

  for (const table of tablesData) {
    const tableId = generateId();
    await db.insert(schema.restaurantTable).values({
      id: tableId,
      name: table.name,
      seats: table.seats,
      createdAt: now,
      tenantId: tenantId,
      createdById: adminPrincipalId,
    });
    createdTables.push({ id: tableId, name: table.name });
    console.log(`Created table: ${table.name} with ${table.seats} seats`);
  }

  // ============================================================================
  // Create Tabs with Items
  // ============================================================================
  console.log("\nCreating tabs with items...");

  const createdTabs: Array<{
    id: string;
    tableId: string;
    items: Array<{ id: string; price: number }>;
  }> = [];

  for (const table of createdTables) {
    const numTabs = randomInt(1, 3);

    for (let j = 0; j < numTabs; j++) {
      const tabId = generateId();
      await db.insert(schema.tab).values({
        id: tabId,
        createdAt: now,
        locked: false,
        closed: false,
        tableID: table.id,
        tenantId: tenantId,
        createdByID: adminPrincipalId,
      });

      // Add 2-4 random items to each tab
      const numItems = randomInt(2, 4);
      const tabItems: Array<{ id: string; price: number }> = [];

      for (let k = 0; k < numItems; k++) {
        const randomMenuItem =
          createdMenuItems[randomInt(0, createdMenuItems.length - 1)];
        const tabItemId = generateId();

        await db.insert(schema.tabItem).values({
          id: tabItemId,
          tabID: tabId,
          menuItemID: randomMenuItem.id,
          createdAt: now,
          tenantId: tenantId,
          createdByID: adminPrincipalId,
        });

        tabItems.push({ id: tabItemId, price: randomMenuItem.price });
      }

      createdTabs.push({ id: tabId, tableId: table.id, items: tabItems });
      console.log(`Created tab for ${table.name} with ${tabItems.length} items`);
    }
  }

  // ============================================================================
  // Create Payments
  // ============================================================================
  console.log("\nCreating payments...");

  // Payment 1: Standalone payment (tip)
  const standalonePaymentId = generateId();
  await db.insert(schema.payment).values({
    id: standalonePaymentId,
    amount: 1550,
    notes: "Cash tip",
    createdAt: now,
    tableID: createdTables[0].id,
    tenantId: tenantId,
    createdByID: adminPrincipalId,
  });
  console.log(`Created standalone payment: €15.50 for ${createdTables[0].name}`);

  // Payment 2: Pay for some tab items from first tab
  const firstTab = createdTabs[0];
  const itemsToPay1 = firstTab.items.slice(0, 2);
  const totalAmount1 = itemsToPay1.reduce((sum, item) => sum + item.price, 0);

  const payment1Id = generateId();
  await db.insert(schema.payment).values({
    id: payment1Id,
    amount: totalAmount1,
    notes: "Partial payment - card",
    createdAt: now,
    tableID: firstTab.tableId,
    tenantId: tenantId,
    createdByID: adminPrincipalId,
  });

  for (const item of itemsToPay1) {
    await db.insert(schema.paymentTabItemPaid).values({
      paymentID: payment1Id,
      tabItemID: item.id,
    });
  }
  console.log(`Created payment: €${(totalAmount1 / 100).toFixed(2)} covering ${itemsToPay1.length} items`);

  // Payment 3: Pay for items from second tab
  if (createdTabs.length > 1) {
    const secondTab = createdTabs[1];
    const itemsToPay2 = secondTab.items.slice(0, 3);
    const totalAmount2 = itemsToPay2.reduce((sum, item) => sum + item.price, 0);

    const payment2Id = generateId();
    await db.insert(schema.payment).values({
      id: payment2Id,
      amount: totalAmount2,
      notes: "Full payment - cash",
      createdAt: now,
      tableID: secondTab.tableId,
      tenantId: tenantId,
      createdByID: adminPrincipalId,
    });

    for (const item of itemsToPay2) {
      await db.insert(schema.paymentTabItemPaid).values({
        paymentID: payment2Id,
        tabItemID: item.id,
      });
    }
    console.log(`Created payment: €${(totalAmount2 / 100).toFixed(2)} covering ${itemsToPay2.length} items`);
  }

  console.log("\nSeed completed successfully!");
} catch (error) {
  console.error("Error during seeding:", error);
  throw error;
} finally {
  await pool.end();
}
