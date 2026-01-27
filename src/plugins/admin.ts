import AdminJS from "adminjs";
import { Sequelize } from "sequelize";
import { schema } from "../schema";
import { buildAuthenticatedRouter } from "./admin/build-authenticated-router";

// Access relationships from the schema object
const allergenRelationships = schema.relationships.allergen;
const categoryRelationships = schema.relationships.category;
const menuItemRelationships = schema.relationships.menuItem;

import { Database, Resource } from "@adminjs/sequelize";

AdminJS.registerAdapter({ Database, Resource });

export async function adminPlugin() {
  // Define models
  const sequelize = new Sequelize(DMNO_CONFIG.ZERO_UPSTREAM_DB, {
    dialect: "postgres",
  });

  const RestaurantSettings = sequelize.define(
    schema.tables.restaurantSettings.name,
    {},
    { tableName: schema.tables.restaurantSettings.name, timestamps: false },
  );
  const MenuItem = sequelize.define(
    schema.tables.menuItem.name,
    {},
    { tableName: schema.tables.menuItem.name, timestamps: false },
  );
  const Category = sequelize.define(
    schema.tables.category.name,
    {},
    { tableName: schema.tables.category.name, timestamps: false },
  );
  const Allergen = sequelize.define(
    schema.tables.allergen.name,
    {},
    { tableName: schema.tables.allergen.name, timestamps: false },
  );

  Category.belongsToMany(MenuItem, {
    through: schema.tables.menuItemCategory.name,
    foreignKey: categoryRelationships.menuItems[0].destField[0],
    otherKey: menuItemRelationships.categories[0].sourceField[0],
  });

  MenuItem.belongsToMany(Category, {
    through: schema.tables.menuItemCategory.name,
    foreignKey: menuItemRelationships.categories[0].destField[0],
    otherKey: categoryRelationships.menuItems[0].sourceField[0],
  });

  Allergen.belongsToMany(MenuItem, {
    through: schema.tables.menuItemAllergen.name,
    foreignKey: menuItemRelationships.allergens[0].destField[0],
    otherKey: allergenRelationships.menuItems[0].sourceField[0],
  });

  // Create AdminJS instance
  const admin = new AdminJS({
    resources: [RestaurantSettings, MenuItem, Category, Allergen],
    rootPath: "/admin",
    branding: {
      companyName: "Coffee Cave",
      withMadeWithLove: false,
    },
  });

  return await buildAuthenticatedRouter(admin);
}
