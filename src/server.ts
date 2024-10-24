import fastifyFormBody from '@fastify/formbody';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyStatic from '@fastify/static';
import fastifyWs from '@fastify/websocket';
import Fastify from 'fastify';
import path from 'path';
import 'reflect-metadata';

import { handleIncomingCall, handleMediaStream } from '@/call';
import { handleChat, serveChat } from '@/services/chat-service';
import { logger } from '@/utils/console-logger';
import { ENV_IS_DEPLOYED, PORT } from '@/utils/environment';

import { useTestRoutes } from './test-routes';

const loggerContext = 'Server';

// Initialize Fastify
const fastify = Fastify(); // { logger: true }
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

// Route for Twilio to handle incoming and outgoing calls
fastify.all('/incoming-call', handleIncomingCall);

// WebSocket route for media-stream
fastify.register(async (fastify) => {
  fastify.get('/media-stream', { websocket: true }, (twilioWs, req) => {
    handleMediaStream(twilioWs, req);
  });
});

// Root Route
fastify.get('/', async (_request, reply) => {
  logger.log(`Request GET /`, undefined, loggerContext);
  reply.send({ message: 'Twilio Media Stream Server is running!' });
});

// Register the static file serving plugin
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../public'),
  prefix: '/public/', // This is optional and will add /public to the URLs
});

// Register rate limiting plugin
fastify.register(fastifyRateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

fastify.get('/chat', serveChat); // Serve the Chat HTML file
fastify.post('/chat', handleChat); // Handle the Chat POST request

if (!ENV_IS_DEPLOYED) {
  // Test Routes
  useTestRoutes(fastify, loggerContext);
}

const startServer = async () => {
  let server: string;
  try {
    server = await fastify.listen({ port: PORT });
    logger.log(`Server is listening on ${server}`, { deployed: ENV_IS_DEPLOYED }, loggerContext);
  } catch (err) {
    logger.error('Error starting server:', err, undefined, loggerContext);
    process.exit(1);
  }
};

const shutdownServer = async (signal: string) => {
  logger.log(`Received ${signal}. Shutting down server...`, undefined, loggerContext);
  try {
    await fastify.close();
    logger.log('Server shut down gracefully', undefined, loggerContext);
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err, undefined, loggerContext);
    process.exit(1);
  }
};

process.on('SIGINT', () => shutdownServer('SIGINT'));
process.on('SIGTERM', () => shutdownServer('SIGTERM'));
process.on('SIGUSR2', () => shutdownServer('SIGUSR2')); // This is often used by nodemon for restarts

startServer();
