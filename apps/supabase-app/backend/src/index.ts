import './loadEnv.js';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { logger, requestLogger } from './utils/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';


const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(requestLogger);
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Supabase Express API',
      version: '1.0.0',
      description: 'REST APIs for user auth, profiles, and admin operations',
    },
    servers: [{ url: `http://localhost:${port}` }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Backend listening on http://localhost:${port}`);
});
