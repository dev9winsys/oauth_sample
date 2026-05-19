import { normalizeEmail } from "src/database/utils/email.util";

describe("normalizeEmail", () => {
  it("should return the email unchanged when there is no '+' in the local part", () => {
    expect(normalizeEmail("aaa@aaa.com")).toBe("aaa@aaa.com");
  });

  it("should strip the '+' alias from the local part", () => {
    expect(normalizeEmail("aaa+1@aaa.com")).toBe("aaa@aaa.com");
  });

  it("should strip a multi-character '+' alias", () => {
    expect(normalizeEmail("user+newsletter@example.com")).toBe(
      "user@example.com",
    );
  });

  it("should lowercase the entire email", () => {
    expect(normalizeEmail("User@Example.COM")).toBe("user@example.com");
  });

  it("should lowercase and strip '+' alias together", () => {
    expect(normalizeEmail("User+Tag@Example.COM")).toBe("user@example.com");
  });

  it("should handle an email with multiple '+' signs (only first segment kept)", () => {
    expect(normalizeEmail("a+b+c@example.com")).toBe("a@example.com");
  });

  it("should return the lowercased input when there is no '@'", () => {
    expect(normalizeEmail("notanemail")).toBe("notanemail");
  });

  it("should preserve a leading '+' in the local part", () => {
    expect(normalizeEmail("+alias@example.com")).toBe("+alias@example.com");
  });
});
