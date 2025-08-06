import "dmno/auto-inject-globals";
import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import { createHashAndSalt } from "../src/utils/auth";

const prisma = new PrismaClient();

console.log("Starting seed process...");

try {
  // Create restaurant settings (singleton)
  const restaurantSettings = await prisma.restaurantSettings.create({
    data: {
      id: "singleton",
      name: "Coffee Cave",
      currencyCode: "EUR", // Euro currency code
      currencyLocale: "en-GB", // UK-based locale
      primaryColor: "#6F4E37", // Coffee brown
      secondaryColor: "#D4B996", // Light coffee/cream color
      timeZone: "Europe/Paris", // As specified
      coinsAndNotes:
        "1,2,5,10,20,50,100,200,500,1000,2000,5000,10000,20000,50000", // Euro denominations in pence (GBP)
    },
  });

  console.log(`Created restaurant settings for: ${restaurantSettings.name}`);
  // Create an admin staff member with PIN access and associated Admin account for elevated access
  const adminPin = "1234"; // Example PIN for regular access
  const adminPassword = "adminPassword123"; // Example password for elevated admin access
  const adminId = nanoid();

  // Generate hash and salt for PIN (for Staff authentication)
  const { hash: pinHash, salt: pinSalt } = await createHashAndSalt(adminPin);

  // Generate hash and salt for password (for Admin authentication)

  // Create the Staff record first
  const adminStaff = await prisma.staff.create({
    data: {
      id: adminId,
      firstName: "Admin",
      lastName: "User",
      pinHash: pinHash,
      pinSalt: pinSalt,
    },
  });

  const { hash: passwordHash, salt: passwordSalt } =
    await createHashAndSalt(adminPassword);
  // Create the associated Admin record with password credentials
  await prisma.admin.create({
    data: {
      id: nanoid(),
      email: "admin@coffeecave.com", // Now using email instead of username
      staffId: adminStaff.id, // Link to the Staff record
      passwordHash: passwordHash,
      passwordSalt: passwordSalt,
    },
  });

  console.log(
    `Created admin staff member: ${adminStaff.firstName} ${adminStaff.lastName} with Admin account`
  );

  // Create a regular staff member with PIN only (no Admin account)
  const staffPin = "5678"; // Example PIN

  // Generate hash and salt for PIN
  const { hash: staffPinHash, salt: staffPinSalt } =
    await createHashAndSalt(staffPin);

  const staffMember = await prisma.staff.create({
    data: {
      id: nanoid(),
      firstName: "Staff",
      lastName: "Member",
      pinHash: staffPinHash,
      pinSalt: staffPinSalt,
    },
  });

  console.log(
    `Created staff member: ${staffMember.firstName} ${staffMember.lastName}`
  );

  // Seed allergens with their respective icons
  console.log("Creating allergens...");
  
  const allergens = [
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

  // Create each allergen and store their IDs
  const allergenIds: Record<string, string> = {};
  for (const { name, icon } of allergens) {
    const allergenId = nanoid();
    const allergen = await prisma.allergen.create({
      data: {
        id: allergenId,
        name,
        icon
      }
    });
    allergenIds[name] = allergenId;
    console.log(`Created allergen: ${allergen.name} with icon: ${allergen.icon}`);
  }

  // Seed menu categories and items
  console.log("\nCreating menu categories and items...");

  // Define categories with icons
  const categories = [
    { name: "Hot Drinks", icon: "coffee" },
    { name: "Cold Drinks", icon: "glass-water" },
    { name: "Pastries", icon: "croissant" },
    { name: "Breakfast", icon: "egg-fried" },
    { name: "Lunch", icon: "utensils" },
    { name: "Desserts", icon: "cake" },
  ];

  // Create each category
  const createdCategories: Record<string, string> = {};
  for (const { name, icon } of categories) {
    const categoryId = nanoid();
    const category = await prisma.category.create({
      data: {
        id: categoryId,
        name,
        icon,
      }
    });
    createdCategories[name] = categoryId;
    console.log(`Created category: ${category.name}`);
  }

  // Create shared menu items that will appear in multiple categories
  const sharedMenuItems = [
    {
      id: nanoid(),
      name: "Fresh Baked Croissant",
      price: 2.95,
      categories: ["Pastries", "Breakfast"]
    },
    {
      id: nanoid(),
      name: "Seasonal Fruit Tart", 
      price: 4.50,
      categories: ["Pastries", "Desserts"]
    },
  ];

  // Menu items organized by category
  const menuItemsByCategory = {
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
    "Pastries": [
      { name: "Pain au Chocolat", price: 325, allergens: ["Gluten", "Milk", "Eggs"] },
      { name: "Almond Croissant", price: 350, allergens: ["Gluten", "Milk", "Eggs", "Tree Nuts"] },
      { name: "Cinnamon Roll", price: 375, allergens: ["Gluten", "Milk", "Eggs"] },
    ],
    "Breakfast": [
      { name: "Avocado Toast", price: 895, allergens: ["Gluten"], dietaries: ["Vegan", "Vegetarian"] },
      { name: "Eggs Benedict", price: 1095, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Breakfast Burrito", price: 950, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Granola Bowl", price: 795, allergens: ["Milk", "Tree Nuts"], dietaries: ["Vegetarian"] },
    ],
    "Lunch": [
      { name: "Club Sandwich", price: 995, allergens: ["Gluten", "Eggs"] },
      { name: "Quinoa Salad", price: 895, allergens: [], dietaries: ["Vegan", "Vegetarian", "Gluten Free"] },
      { name: "Soup of the Day", price: 595, allergens: ["Celery"] },
      { name: "Grilled Chicken Panini", price: 1050, allergens: ["Gluten"] },
      { name: "Roasted Vegetable Wrap", price: 895, allergens: ["Gluten"], dietaries: ["Vegetarian"] },
    ],
    "Desserts": [
      { name: "Chocolate Brownie", price: 425, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Cheesecake", price: 550, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Carrot Cake", price: 495, allergens: ["Gluten", "Eggs", "Milk"] },
      { name: "Macarons (3pc)", price: 650, allergens: ["Eggs", "Tree Nuts"] },
    ],
  };

  // First create all shared menu items
  console.log("\nCreating shared menu items...");
  for (const item of sharedMenuItems) {
    const menuItem = await prisma.menuItem.create({
      data: {
        id: item.id,
        name: item.name,
        price: item.price,
        createdByID: adminStaff.id,
      }
    });
    
    // Create the category relationships
    for (const categoryName of item.categories) {
      const categoryId = createdCategories[categoryName];
      await prisma.menuItemCategory.create({
        data: {
          menuItemID: menuItem.id,
          categoryID: categoryId,
        }
      });
    }
    
    // Add allergens (assuming shared items have standard allergens)
    const defaultAllergens = ["Gluten", "Eggs", "Milk"];
    for (const allergenName of defaultAllergens) {
      const allergenId = allergenIds[allergenName];
      if (allergenId) {
        await prisma.menuItemAllergen.create({
          data: {
            menuItemID: menuItem.id,
            allergenID: allergenId,
          }
        });
      }
    }
    
    console.log(`Created shared menu item: ${menuItem.name} in ${item.categories.join(", ")} categories`);
  }

  // Then create category-specific menu items
  console.log("\nCreating category-specific menu items...");
  for (const [categoryName, items] of Object.entries(menuItemsByCategory)) {
    const categoryId = createdCategories[categoryName];
    
    for (const item of items) {
      const menuItem = await prisma.menuItem.create({
        data: {
          id: nanoid(),
          name: item.name,
          price: item.price,
          createdByID: adminStaff.id,
        }
      });
      
      // Create the category relationship
      await prisma.menuItemCategory.create({
        data: {
          menuItemID: menuItem.id,
          categoryID: categoryId,
        }
      });
      
      // Add allergens if present
      if (item.allergens && item.allergens.length > 0) {
        for (const allergenName of item.allergens) {
          const allergenId = allergenIds[allergenName];
          if (allergenId) {
            await prisma.menuItemAllergen.create({
              data: {
                menuItemID: menuItem.id,
                allergenID: allergenId,
              }
            });
          }
        }
      }
      
      console.log(`Created menu item: ${menuItem.name} in ${categoryName}`);
    }
  }

  console.log("\nSeed completed successfully!");
} catch (error) {
  console.error("Error during seeding:", error);
} finally {
  await prisma.$disconnect();
}
