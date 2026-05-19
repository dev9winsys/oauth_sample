import {
  hashPassword,
  comparePassword,
} from "src/database/utils/password.util";

describe("Password Utility", () => {
  describe("hashPassword", () => {
    it("should hash a password", async () => {
      const plainPassword = "testPassword123";
      const hashedPassword = await hashPassword(plainPassword);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword).toMatch(/^\$2b\$/); // bcrypt hash starts with $2b$
    });

    it("should generate different hashes for the same password", async () => {
      const plainPassword = "testPassword123";
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2); // Due to different salts
    });

    it("should throw error for empty password", async () => {
      await expect(hashPassword("")).rejects.toThrow("Invalid password");
    });

    it("should throw error for null password", async () => {
      await expect(hashPassword(null as any)).rejects.toThrow(
        "Invalid password",
      );
    });

    it("should throw error for non-string password", async () => {
      await expect(hashPassword(123 as any)).rejects.toThrow(
        "Invalid password",
      );
    });
  });

  describe("comparePassword", () => {
    it("should return true for matching password", async () => {
      const plainPassword = "testPassword123";
      const hashedPassword = await hashPassword(plainPassword);
      const result = await comparePassword(plainPassword, hashedPassword);

      expect(result).toBe(true);
    });

    it("should return false for non-matching password", async () => {
      const plainPassword = "testPassword123";
      const wrongPassword = "wrongPassword";
      const hashedPassword = await hashPassword(plainPassword);
      const result = await comparePassword(wrongPassword, hashedPassword);

      expect(result).toBe(false);
    });

    it("should return false for empty password", async () => {
      const hashedPassword = await hashPassword("testPassword123");
      const result = await comparePassword("", hashedPassword);

      expect(result).toBe(false);
    });

    it("should return false for empty hash", async () => {
      const result = await comparePassword("testPassword123", "");

      expect(result).toBe(false);
    });

    it("should return false for non-string password", async () => {
      const hashedPassword = await hashPassword("testPassword123");
      const result = await comparePassword(123 as any, hashedPassword);

      expect(result).toBe(false);
    });

    it("should return false for non-string hash", async () => {
      const result = await comparePassword("testPassword123", 123 as any);

      expect(result).toBe(false);
    });
  });
});
