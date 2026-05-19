import "reflect-metadata";
import { DataSource } from "typeorm";
import { config } from "dotenv";

config();

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USERNAME || process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  schema: process.env.DB_SCHEMA || "public",
  entities: ["dist/database/entity/*.entity.js"],
  migrations: ["dist/database/migrations/*.js"],
  synchronize: process.env.SYNCHRONIZE === "true",
  logging: process.env.DB_LOGGING === "true",
});
