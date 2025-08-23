import { Sequelize } from "sequelize";
import { PrismaClient } from "@prisma/client";

export const sequelize = new Sequelize(DMNO_CONFIG.ZERO_UPSTREAM_DB, {
  dialect: "postgres",
});

export const db = new PrismaClient();