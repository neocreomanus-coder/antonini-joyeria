import { describe, it, expect, beforeAll, afterAll } from "vitest";
import bcrypt from "bcrypt";
import * as db from "./db";

describe("Manual Admin Authentication", () => {
  const testUsername = `test-admin-${Date.now()}`;
  const testPassword = "TestPassword123!";
  let testUserId: number;

  beforeAll(async () => {
    // Create a test admin user
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    const result = await db.createAdminUser(
      testUsername,
      hashedPassword,
      "Test Admin",
      "test@admin.local"
    );
    testUserId = (result as any)[0]?.insertId || 1;
  });

  it("should retrieve user by username", async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user).toBeDefined();
    expect(user?.username).toBe(testUsername);
    expect(user?.role).toBe("admin");
  });

  it("should hash password correctly", async () => {
    const user = await db.getUserByUsername(testUsername);
    expect(user?.passwordHash).toBeDefined();
    
    // Verify password matches
    const isValid = await bcrypt.compare(testPassword, user!.passwordHash!);
    expect(isValid).toBe(true);
  });

  it("should reject invalid password", async () => {
    const user = await db.getUserByUsername(testUsername);
    const isValid = await bcrypt.compare("WrongPassword", user!.passwordHash!);
    expect(isValid).toBe(false);
  });

  it("should update admin password", async () => {
    const newPassword = "NewPassword456!";
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await db.updateAdminPassword(testUserId, newHashedPassword);
    expect(result.success).toBe(true);

    // Verify new password works
    const user = await db.getUserByUsername(testUsername);
    const isValid = await bcrypt.compare(newPassword, user!.passwordHash!);
    expect(isValid).toBe(true);
  });

  it("should not retrieve non-existent user", async () => {
    const user = await db.getUserByUsername("non-existent-user-xyz");
    expect(user).toBeUndefined();
  });

  afterAll(async () => {
    // Cleanup is handled by the test database
  });
});
