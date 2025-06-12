import { Elysia } from 'elysia';
import { Logger } from './utils/logger.ts';

const log = Logger.extend('TestServer');

const COMPANY_ID = process.env.COMPANY_ID || 'test-company';
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3001');

log.info(
  `🚀 Starting simple test server for ${COMPANY_ID} on port ${SERVER_PORT}`,
);

new Elysia()
  .get('/', () => ({
    status: 'success',
    message: 'Blockchain EV Charging Server - Test Mode',
    company: COMPANY_ID,
    port: SERVER_PORT,
    timestamp: new Date().toISOString(),
  }))
  .get('/health', () => ({ status: 'healthy', company: COMPANY_ID }))
  .listen(SERVER_PORT, () => {
    log.info(`✅ Test server listening on http://localhost:${SERVER_PORT}`);
    log.info(`🏢 Company: ${COMPANY_ID}`);
  });

log.info('🎯 Server setup complete');
