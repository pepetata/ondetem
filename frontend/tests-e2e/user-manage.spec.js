import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  let userId;
  let token;
  const email = `e2euser${Date.now()}@test.com`;
  const password = "senhaSegura123";

  test.beforeAll(async ({ request }) => {
    // Create a user via API
    const res = await request.post("http://localhost:3000/api/users", {
      data: {
        fullName: "Usuário E2E Manage",
        nickname: "E2EManage",
        email,
        password,
      },
    });
    expect(res.ok()).toBeTruthy();
    const data = await res.json();
    userId = data.userId;

    // Login to get token
    const loginRes = await request.post(
      "http://localhost:3000/api/auth/login",
      {
        data: { email, password },
      }
    );
    expect(loginRes.ok()).toBeTruthy();
    const loginData = await loginRes.json();
    token = loginData.token;
  });

  test("should update user with token", async ({ request }) => {
    const newNickname = "E2EUpdated";
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
  });

  test("should not delete user without token", async ({ request }) => {
    // Try to delete again without token
    const res = await request.delete(
      `http://localhost:3000/api/users/${userId}`
    );
    expect(res.status()).toBe(401);
  });
});
