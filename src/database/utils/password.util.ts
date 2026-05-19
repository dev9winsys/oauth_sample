import * as bcrypt from "bcrypt";

const DEFAULT_SALT_ROUNDS = 10;

/**
 * Get salt rounds from environment variable or use default
 * @returns Salt rounds for bcrypt
 */
function getSaltRounds(): number {
  const envValue = process.env.BCRYPT_SALT_ROUNDS;
  if (!envValue) {
    return DEFAULT_SALT_ROUNDS;
  }

  const parsed = parseInt(envValue, 10);

  if (Number.isNaN(parsed) || parsed < 4 || parsed > 31) {
    return DEFAULT_SALT_ROUNDS;
  }

  return parsed;
}

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Invalid password");
  }
  const saltRounds = getSaltRounds();
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password
 * @returns True if password matches, false otherwise
 */
export async function comparePassword(
  password: string,
  hashedPassword: string,
): Promise<boolean> {
  if (
    typeof password !== "string" ||
    typeof hashedPassword !== "string" ||
    password.length === 0 ||
    hashedPassword.length === 0
  ) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
}
