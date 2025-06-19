const request = require("supertest");
const app = require("../../src/app");
const { Pool } = require("pg");
require("dotenv").config({ path: ".env.test" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

beforeAll(async () => {
  await pool.query("DELETE FROM ads");
});

afterAll(async () => {
  await pool.end();
});

describe("Ads API", () => {
  const validAd = {
    title: "Anúncio Teste",
    short: "Descrição curta",
    description: "Descrição detalhada do anúncio.",
    tags: "teste,anuncio",
    zipcode: "12345678",
    city: "São Paulo",
    state: "SP",
    address1: "Rua Exemplo",
    streetnumber: "100",
    address2: "Apto 10",
    radius: 10,
    phone1: "(11)99999-9999",
    phone2: "(11)98888-8888",
    whatsapp: "(11)97777-7777",
    email: "anuncio@teste.com",
    website: "https://www.exemplo.com",
    startdate: "2024-07-01",
    finishdate: "2024-07-31",
    timetext: "Seg a Sex das 8h às 18h",
  };

  let adId;

  test("should create a new ad with valid data", async () => {
    const res = await request(app).post("/api/ads").send(validAd);
    expect(res.statusCode).toBe(201);
    expect(res.body.adId).toBeDefined();
    adId = res.body.adId;
  });

  test("should get all ads", async () => {
    const res = await request(app).get("/api/ads");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("should get ad by id", async () => {
    const res = await request(app).get(`/api/ads/${adId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(adId);
    expect(res.body.title).toBe(validAd.title);
  });

  test("should update ad", async () => {
    const updated = { ...validAd, title: "Título Atualizado" };
    const res = await request(app).put(`/api/ads/${adId}`).send(updated);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/updated/i);

    // Confirm update
    const getRes = await request(app).get(`/api/ads/${adId}`);
    expect(getRes.body.title).toBe("Título Atualizado");
  });

  test("should delete ad", async () => {
    const res = await request(app).delete(`/api/ads/${adId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);

    // Confirm deletion
    const getRes = await request(app).get(`/api/ads/${adId}`);
    expect(getRes.statusCode).toBe(404);
  });

  test("should return 404 for non-existing ad", async () => {
    const res = await request(app).get(
      "/api/ads/00000000-0000-0000-0000-000000000000"
    );
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});
