// packages/orchestrator/src/fastify/buildServer.ts
import fastify from "fastify";

export function buildServer() {
  const isProd = process.env.NODE_ENV === "production";

  const app = fastify({
    logger: isProd
      ? true // JSON logs in production
      : {
          level: "debug",
          transport: {
            target: "pino-pretty",
            options: { colorize: true },
          },
        },
  });

  // Register your routes
  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
