// packages/orchestrator/src/server-fastify.ts
import { buildServer } from "./fastify/buildServer";

async function start() {
  const app = buildServer();

  try {
    await app.listen({ port: 3000, host: "0.0.0.0" });

    app.log.info(
      { port: 3000, env: process.env.NODE_ENV ?? "development" },
      "🚀 Fastify orchestrator running"
    );
  } catch (err) {
    app.log.error(err, "Failed to start orchestrator");
    process.exit(1);
  }
}

start();
