const request = require("supertest");
const app = require("../../src/app");
const { Pool } = require("pg");
const { userFormFields } = require("../../src/formfields/userFieldsValidation");
require("dotenv").config({ path: ".env.test" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

beforeAll(async () => {
  await pool.query("DELETE FROM users");
});

afterAll(async () => {
  await pool.end();
});

describe("User field validation", () => {
  const validUser = {
    fullName: "Test User",
    nickname: "Tester",
    email: "test@example.com",
    password: "password123",
  };

  test("should create a new user with valid data", async () => {
    const res = await request(app).post("/api/users").send(validUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.userId).toBeDefined();
  });

  Object.entries(userFormFields).forEach(([field, config]) => {
    if (config.required) {
      test(`should fail if ${field} is missing`, async () => {
        const user = { ...validUser };
        delete user[field];
        const res = await request(app).post("/api/users").send(user);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(new RegExp(config.requiredError, "i"));
      });

      test(`should fail if ${field} is empty`, async () => {
        const user = { ...validUser, [field]: "" };
        const res = await request(app).post("/api/users").send(user);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/obrigatório/i);
      });
    }
    if (config.minLength) {
      test(`should fail if ${field} is shorter than minLength`, async () => {
        const user = {
          ...validUser,
          [field]: "a".repeat(config.minLength - 1),
        };
        const res = await request(app).post("/api/users").send(user);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/mínimo|entre/i);
      });
    }
    if (config.maxLength) {
      test(`should fail if ${field} is longer than maxLength`, async () => {
        const user = {
          ...validUser,
          [field]: "a".repeat(config.maxLength + 1),
        };
        const res = await request(app).post("/api/users").send(user);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/máximo|entre/i);
      });
    }
    if (config.type === "email") {
      test(`should fail if ${field} is not a valid email`, async () => {
        const user = { ...validUser, [field]: "not-an-email" };
        const res = await request(app).post("/api/users").send(user);
        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/inválido/i);
      });
    }
  });
});

describe("User update", () => {
  let userId;
  const originalUser = {
    fullName: "Update Test",
    nickname: "UpTest",
    email: "updatetest@example.com",
    password: "password123",
  };

  beforeAll(async () => {
    const res = await request(app).post("/api/users").send(originalUser);
    userId = res.body.userId;
  });

  test("should update user nickname", async () => {
    const updatedNickname = "UpdatedNick";
    const res = await request(app).put(`/api/users/${userId}`).send({
      fullName: "Update Test",
      nickname: updatedNickname,
      email: "updatetest@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.nickname).toBe(updatedNickname);
  });

  test("should fail update with invalid email", async () => {
    const res = await request(app).put(`/api/users/${userId}`).send({
      fullName: "Update Test",
      nickname: "UpTest",
      email: "invalid-email",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/inválido/i);
  });

  test("should fail update with too short nickname", async () => {
    const res = await request(app).put(`/api/users/${userId}`).send({
      fullName: "Update Test",
      nickname: "ab",
      email: "updatetest@example.com",
      password: "password123",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/mínimo|entre/i);
  });
});
