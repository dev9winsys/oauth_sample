import { v7 as uuidv7 } from "uuid";

/**
 * Generates a UUID v7
 * UUID v7 is a time-ordered UUID that includes a timestamp,
 * making it more efficient for database indexing and sorting
 */
export function generateUuidV7(): string {
  return uuidv7();
}
