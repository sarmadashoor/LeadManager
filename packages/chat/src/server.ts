// packages/chat/src/server.ts

import * as dotenv from 'dotenv';
dotenv.config();

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { chatRoutes } from './api/routes';

export async function buildServer(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname'
        }
      }
    }
  });

  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  });

  await app.register(chatRoutes);

  return app;
}

if (require.main === module) {
  const start = async () => {
    try {
      const server = await buildServer();
      const port = parseInt(process.env.PORT || '3001', 10);
      const host = process.env.HOST || '0.0.0.0';

      await server.listen({ port, host });
      console.log(`🚀 Chat API running on http://${host}:${port}`);
      console.log(`📊 Health check: http://${host}:${port}/health`);
      console.log(`💬 Chat endpoint: http://${host}:${port}/api/chat/:leadId/message`);
    } catch (err) {
      console.error('Error starting server:', err);
      process.exit(1);
    }
  };

  start();
}
