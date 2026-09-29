import 'dotenv/config';

import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { seedIncidentData } from './utils/seedData.js';
import { Incident } from './models/Incident.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    logger.info('Initializing Incident Memory Agent Backend Server...');

    // Connect to database (remote Atlas or in-memory fallback)
    await connectDatabase();

    // Auto-seed realistic demo data if collection is empty
    const count = await Incident.countDocuments();
    if (count === 0) {
      logger.info('No existing incidents detected. Auto-seeding initial realistic operational dataset...');
      await seedIncidentData(false);
    } else {
      logger.info(`Database contains ${count} incidents ready for investigation.`);
    }

    const server = app.listen(PORT, () => {
      logger.info(`Server successfully listening on http://localhost:${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/api/health`);
    });

    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    logger.error('Failed to start server:', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

bootstrap();
