import type { FastifyInstance } from 'fastify';

import { agent } from '@/agent';
import { sendToWebhook } from '@/services/send-to-webhook';
import { testSession } from '@/testdata/session.data';
import { logger } from '@/utils/console-logger';

export const useTestRoutes = (fastify: FastifyInstance, loggerContext: string) => {
  fastify.get('/test/function-call/1', async (request, reply) => {
    logger.log(`Request GET ${request.url}`, undefined, loggerContext);
    sendToWebhook(
      {
        action: 'add_memory',
        session: testSession,
        parameters: {
          key: 'test',
          value: 'test',
        },
      },
      agent.getToolResponseSchema('add_memory')
    ).then((response) => {
      logger.log('Response from webhook:', { response }, loggerContext);
      reply.send({ success: true, message: 'Response from webhook!', response });
    });
  });

  fastify.get('/test/function-call/2', async (request, reply) => {
    logger.log(`Request GET ${request.url}`, undefined, loggerContext);
    sendToWebhook(
      {
        action: 'remove_memory',
        session: testSession,
        parameters: {
          key: 'test',
        },
      },
      agent.getToolResponseSchema('remove_memory')
    ).then((response) => {
      logger.log('Response from webhook:', { response }, loggerContext);
      reply.send({ success: true, message: 'Response from webhook!', response });
    });
  });

  fastify.get('/test/function-call/3', async (request, reply) => {
    logger.log(`Request GET ${request.url}`, undefined, loggerContext);
    sendToWebhook(
      {
        action: 'call_summary',
        session: testSession,
      },
      agent.getToolResponseSchema('call_summary')
    ).then((response) => {
      logger.log('Response from webhook:', { response }, loggerContext);
      reply.send({ success: true, message: 'Response from webhook!', response });
    });
  });

  fastify.get('/test/function-call/4', async (request, reply) => {
    logger.log(`Request GET ${request.url}`, undefined, loggerContext);
    sendToWebhook(
      {
        action: 'non_existing_action' as any,
        session: testSession,
        parameters: {
          wubba: 'lubba',
        } as any,
      },
      agent.getToolResponseSchema('non_existing_action')
    ).then((response) => {
      logger.log('Response from webhook:', { response }, loggerContext);
      reply.send({ success: true, message: 'Response from webhook!', response });
    });
  });
};
