import { buildServer } from "../fastify/buildServer";
import fastify from "fastify";

describe("Fastify Server Bootstrap", () => {
  it("starts without crashing", async () => {
    const app = buildServer();

    // Fastify start test
    await app.ready();

    // health route should exist (we add it soon)
    const res = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toHaveProperty("status", "ok");

    await app.close();
  });
});
