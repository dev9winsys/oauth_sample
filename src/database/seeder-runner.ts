import "reflect-metadata";
import { DataSource } from "typeorm";
import dataSource from "./data-source";
import { seeders } from "./seeders";

/**
 * Seeder Runner
 * Executes all seeders registered in the seeders array
 */
async function runSeeders() {
  // Validate that there are seeders to process before connecting to database
  if (seeders.length === 0) {
    console.log("⚠️  No seeders to run");
    return;
  }

  let connection: DataSource | null = null;

  try {
    console.log("🌱 Connecting to database...");
    connection = await dataSource.initialize();
    console.log("✅ Database connection established");

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      console.log(`\n🚀 Running ${seeders.length} seeder(s)...\n`);

      for (const SeederClass of seeders) {
        const seederName = SeederClass.name;
        console.log(`📦 Running seeder: ${seederName}`);

        const seederInstance = new SeederClass();
        await seederInstance.run(queryRunner);

        console.log(`✅ Seeder completed: ${seederName}\n`);
      }

      await queryRunner.commitTransaction();

      console.log("🎉 All seeders completed successfully!");
    } catch (error) {
      console.error("❌ Seeder execution failed. Rolling back transaction...");
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
      console.log("🔌 Database connection closed");
    }
  }
}

/**
 * Revert all seeders
 * Executes the revert method of all seeders in reverse order
 */
async function revertSeeders() {
  // Validate that there are seeders to revert before connecting to database
  if (seeders.length === 0) {
    console.log("⚠️  No seeders to revert");
    return;
  }

  let connection: DataSource | null = null;

  try {
    console.log("🌱 Connecting to database...");
    connection = await dataSource.initialize();
    console.log("✅ Database connection established");

    const queryRunner = connection.createQueryRunner();
    await queryRunner.connect();

    await queryRunner.startTransaction();

    try {
      // Reverse the order for revert
      const reversedSeeders = [...seeders].reverse();

      console.log(`\n⏮️  Reverting ${reversedSeeders.length} seeder(s)...\n`);

      for (const SeederClass of reversedSeeders) {
        const seederName = SeederClass.name;
        console.log(`📦 Reverting seeder: ${seederName}`);

        const seederInstance = new SeederClass();
        await seederInstance.revert(queryRunner);

        console.log(`✅ Seeder reverted: ${seederName}\n`);
      }

      await queryRunner.commitTransaction();

      console.log("🎉 All seeders reverted successfully!");
    } catch (error) {
      console.error("❌ Seeder revert failed. Rolling back transaction...");
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error("❌ Revert failed:", error);
    process.exit(1);
  } finally {
    if (connection && connection.isInitialized) {
      await connection.destroy();
      console.log("🔌 Database connection closed");
    }
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (command === "revert") {
  revertSeeders();
} else {
  runSeeders();
}
