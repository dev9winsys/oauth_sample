import { User } from "src/database/entity/user.entity";
import { comparePassword } from "src/database/utils";
import { version, validate } from "uuid";
import { getMetadataArgsStorage } from "typeorm";

describe("User Entity Password Hashing", () => {
  describe("BeforeInsert hook", () => {
    it("should hash password before insert", async () => {
      const user = new User();
      user.name = "Test User";
      user.email = "test@example.com";
      user.password = "plainPassword123";

      const plainPassword = user.password;
      await user.hashPassword();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2b\$/); // bcrypt hash

      // Verify the hash is valid
      const isMatch = await comparePassword(plainPassword, user.password);
      expect(isMatch).toBe(true);
    });

    it("should not rehash already hashed password", async () => {
      const user = new User();
      user.password =
        "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"; // Already hashed

      const hashedPassword = user.password;
      await user.hashPassword();

      expect(user.password).toBe(hashedPassword);
    });

    it("should not rehash password with $2a$ format", async () => {
      const user = new User();
      user.password =
        "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

      const hashedPassword = user.password;
      await user.hashPassword();

      expect(user.password).toBe(hashedPassword);
    });

    it("should not rehash password with $2x$ format", async () => {
      const user = new User();
      user.password =
        "$2x$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

      const hashedPassword = user.password;
      await user.hashPassword();

      expect(user.password).toBe(hashedPassword);
    });

    it("should not rehash password with $2y$ format", async () => {
      const user = new User();
      user.password =
        "$2y$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

      const hashedPassword = user.password;
      await user.hashPassword();

      expect(user.password).toBe(hashedPassword);
    });
  });

  describe("BeforeUpdate hook", () => {
    it("should hash password before update if password is changed", async () => {
      const user = new User();
      user.password = "newPassword456";

      const plainPassword = user.password;
      await user.hashPassword();

      expect(user.password).not.toBe(plainPassword);
      expect(user.password).toMatch(/^\$2b\$/);

      // Verify the hash is valid
      const isMatch = await comparePassword(plainPassword, user.password);
      expect(isMatch).toBe(true);
    });

    it("should not rehash if password is already hashed", async () => {
      const user = new User();
      user.password =
        "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

      const hashedPassword = user.password;
      await user.hashPassword();

      expect(user.password).toBe(hashedPassword);
    });
  });
});

describe("User Entity new columns", () => {
  it("should have login_failure_count column with default 0", () => {
    const columns = getMetadataArgsStorage().columns;
    const col = columns.find(
      (c) => c.target === User && c.propertyName === "login_failure_count",
    );
    expect(col).toBeDefined();
    expect((col?.options as { default?: unknown }).default).toBe(0);
  });

  it("should increment login_failure_count", () => {
    const user = new User();
    user.login_failure_count = 0;
    user.login_failure_count += 1;
    expect(user.login_failure_count).toBe(1);
  });

  it("should have previous_passwords column as nullable simple-json", () => {
    const columns = getMetadataArgsStorage().columns;
    const col = columns.find(
      (c) => c.target === User && c.propertyName === "previous_passwords",
    );
    expect(col).toBeDefined();
    expect(col?.options.nullable).toBe(true);
    expect((col?.options as { type?: string }).type).toBe("simple-json");
  });

  it("should serialize and deserialize previous_passwords correctly", () => {
    const user = new User();
    const passwords = ["$2b$10$abc", "$2b$10$def"];
    user.previous_passwords = passwords;
    const json = JSON.stringify(user.previous_passwords);
    const parsed: string[] = JSON.parse(json);
    expect(parsed).toEqual(passwords);
  });

  it("should have pending_email column as nullable varchar", () => {
    const columns = getMetadataArgsStorage().columns;
    const col = columns.find(
      (c) => c.target === User && c.propertyName === "pending_email",
    );
    expect(col).toBeDefined();
    expect(col?.options.nullable).toBe(true);
  });
});

describe("User Entity ID Generation", () => {
  describe("generateUserId hook", () => {
    it("should generate UUID v7 when user_id is not set", () => {
      const user = new User();
      user.name = "Test User";
      user.email = "test@example.com";
      user.password = "plainPassword123";

      user.generateUserId();

      expect(user.user_id).toBeDefined();
      expect(validate(user.user_id)).toBe(true);
      expect(version(user.user_id)).toBe(7);
    });

    it("should preserve explicitly provided user_id", () => {
      const user = new User();
      const providedId = "123e4567-e89b-12d3-a456-426614174000";
      user.user_id = providedId;
      user.name = "Test User";
      user.email = "test@example.com";
      user.password = "plainPassword123";

      user.generateUserId();

      expect(user.user_id).toBe(providedId);
    });

    it("should generate unique ids for multiple users", () => {
      const user1 = new User();
      const user2 = new User();

      user1.generateUserId();
      user2.generateUserId();

      expect(user1.user_id).toBeDefined();
      expect(user2.user_id).toBeDefined();
      expect(user1.user_id).not.toBe(user2.user_id);
    });
  });
});
