import { generateUuidV7 } from "src/database/utils/uuid.util";
import { version, validate } from "uuid";

describe("UUID Utility", () => {
  describe("generateUuidV7", () => {
    it("should generate a valid UUID v7", () => {
      const uuid = generateUuidV7();

      // Check if it's a valid UUID
      expect(validate(uuid)).toBe(true);

      // Check if it's specifically a v7 UUID
      expect(version(uuid)).toBe(7);
    });

    it("should generate unique UUIDs", () => {
      const uuid1 = generateUuidV7();
      const uuid2 = generateUuidV7();

      expect(uuid1).not.toBe(uuid2);
    });

    it("should generate time-ordered UUIDs", () => {
      // UUID v7 is time-ordered, so UUIDs generated later should be lexicographically greater
      const uuids: string[] = [];

      for (let i = 0; i < 100; i++) {
        uuids.push(generateUuidV7());
      }

      for (let i = 0; i < uuids.length - 1; i++) {
        expect(uuids[i + 1] >= uuids[i]).toBe(true);
      }
    });

    it("should return a string in UUID format", () => {
      const uuid = generateUuidV7();
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(uuid).toMatch(uuidRegex);
    });
  });
});
