import AdminJS from "adminjs";
import { buildAuthenticatedRouter } from "./admin/build-authenticated-router";
import { Sequelize } from "sequelize";
import { allergenTableRelationships, categoryTableRelationships, menuItemTableRelationships, schema } from "../schema";
import { Database, Resource } from "@adminjs/sequelize";

AdminJS.registerAdapter({ Database, Resource });

export async function adminPlugin() {
  // Define models
  const sequelize = new Sequelize(DMNO_CONFIG.ZERO_UPSTREAM_DB, {
    dialect: "postgres",
  });

  const RestaurantSettings = sequelize.define(
    schema.tables.restaurant_settings.name,
    {},
    { tableName: schema.tables.restaurant_settings.name, timestamps: false }
  );
  const MenuItem = sequelize.define(
    schema.tables.menu_item.name,
    {},
    { tableName: schema.tables.menu_item.name, timestamps: false }
  );
  const Category = sequelize.define(
    schema.tables.category.name,
    {},
    { tableName: schema.tables.category.name, timestamps: false }
  );
  const Allergen = sequelize.define(
    schema.tables.allergen.name,
    {},
    { tableName: schema.tables.allergen.name, timestamps: false }
  );

  Category.belongsToMany(MenuItem, {
    through: schema.tables.menu_item_category.name,
    foreignKey:
      categoryTableRelationships.relationships.menuItems[0].destField[0],
    otherKey:
      menuItemTableRelationships.relationships.categories[0].sourceField[0],
  });

  MenuItem.belongsToMany(Category, {
    through: schema.tables.menu_item_category.name,
    foreignKey:
      menuItemTableRelationships.relationships.categories[0].destField[0],
    otherKey:
      categoryTableRelationships.relationships.menuItems[0].sourceField[0],
  });

  Allergen.belongsToMany(MenuItem, {
    through: schema.tables.menu_item_allergen.name,
    foreignKey:
      menuItemTableRelationships.relationships.allergens[0].destField[0],
    otherKey:
      allergenTableRelationships.relationships.menuItems[0].sourceField[0],
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
