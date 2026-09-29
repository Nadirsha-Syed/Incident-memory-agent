import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import incidentRoutes from './routes/incident.routes.js';
import memoryRoutes from './routes/memory.routes.js';
import demoRoutes from './routes/demo.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { hindsightConfig } from './config/hindsight.js';
import { groqConfig } from './config/groq.js';

dotenv.config();

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: '*', // Permissive for hackathon review across localhost/Vercel/Render
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: 'incident-memory-agent-server',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      integrations: {
        hindsight: {
          apiUrl: hindsightConfig.apiUrl,
          bankId: hindsightConfig.bankId,
          configured: hindsightConfig.isConfigured,
        },
        groq: {
          model: groqConfig.model,
          configured: groqConfig.isConfigured,
        },
      },
    });
  });

  // API Routes
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/memory', memoryRoutes);
  app.use('/api/demo', demoRoutes);

  // 404 & Centralized Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export const app = createApp();
