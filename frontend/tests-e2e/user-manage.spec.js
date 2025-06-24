import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  let userId;
  let token;
  const timestamp = Date.now();
  const email = `e2euser${timestamp}@test.com`;
  const password = "senhaSegura123";

  test.beforeAll(async ({ request }) => {
    // Create a user via API
    const userData = {
      fullName: `Usuário E2E Manage ${timestamp}`,
      nickname: `E2EManage${timestamp}`,
      email,
      password,
    };

    console.log(`Creating test user: ${email}`);

    const res = await request.post("http://localhost:3000/api/users", {
      data: userData,
    });

    if (!res.ok()) {
      const errorData = await res.text();
      console.error(
        `User creation failed with status ${res.status()}: ${errorData}`
      );
      throw new Error(`Failed to create user: ${res.status()} - ${errorData}`);
    }

    const data = await res.json();
    userId = data.userId;
    console.log(`✅ Created test user with ID: ${userId}`);

    // Login to get token
    const loginRes = await request.post(
      "http://localhost:3000/api/auth/login",
      {
        data: { email, password },
      }
    );

    if (!loginRes.ok()) {
      const errorData = await loginRes.text();
      console.error(
        `Login failed with status ${loginRes.status()}: ${errorData}`
      );
      throw new Error(`Failed to login: ${loginRes.status()} - ${errorData}`);
    }

    const loginData = await loginRes.json();
    token = loginData.token;
    console.log(`✅ Login successful, got token`);
  });

  test.afterAll(async ({ request }) => {
    // Clean up the test user if it exists
    if (userId && token) {
      try {
        await request.delete(`http://localhost:3000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log(`✅ Cleaned up test user: ${userId}`);
      } catch (error) {
        console.log(`⚠️ Could not clean up test user: ${error.message}`);
      }
    }
  });

  test("should update user with token", async ({ request }) => {
    const newNickname = `E2EUpdated${timestamp}`;
    const res = await request.put(`http://localhost:3000/api/users/${userId}`, {
      data: { nickname: newNickname },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.ok()).toBeTruthy();
    const updated = await res.json();
    expect(updated.nickname).toBe(newNickname);
  });

  test("should not update user without token", async ({ request }) => {
    const res = await request.put(`http://localhost:3000/api/users/${userId}`, {
      data: { nickname: "ShouldFail" },
    });
    expect(res.status()).toBe(401);
  });

  test("should delete user with token", async ({ request }) => {
    const res = await request.delete(
      `http://localhost:3000/api/users/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    expect(data.message || data.success).toBeTruthy();

    // Mark user as deleted so afterAll doesn't try to delete again
    userId = null;
  });

  test("should not delete user without token", async ({ request }) => {
    // Skip this test if user was already deleted in previous test
    if (!userId) {
      test.skip("User already deleted in previous test");
      return;
    }

    // Try to delete without token (should fail)
    const res = await request.delete(
      `http://localhost:3000/api/users/${userId}`
    );
    expect(res.status()).toBe(401);
  });
});
