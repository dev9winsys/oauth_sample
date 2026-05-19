import { DemoDataSeeder } from "./demo-data.seeder";
import { Seeder, SeederConstructor } from "./seeder.interface";

/**
 * List of all seeders to be run
 * Add new seeders to this array in the order they should be executed
 */
export const seeders: SeederConstructor[] = [DemoDataSeeder];

export { DemoDataSeeder };
export type { Seeder, SeederConstructor };
