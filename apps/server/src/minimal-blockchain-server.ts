import { Elysia } from 'elysia';
import { EthereumConsensus } from './utils/ethereum-consensus.ts';
import { Logger } from './utils/logger.ts';

const log = Logger.extend('MinimalBlockchainServer');

const SERVER_PORT = parseInt(process.env.SERVER_PORT || '8091');
const COMPANY_ID = process.env.COMPANY_ID || 'company-a';

log.info(
  `🚀 Starting minimal blockchain server for ${COMPANY_ID} on port ${SERVER_PORT}`,
);

// Initialize Ethereum consensus system
const blockchain = new EthereumConsensus();

// Initialize blockchain
const initBlockchain = async () => {
  try {
    const isAvailable = await blockchain.initialize();
    log.info(`🔗 Blockchain available: ${isAvailable}`);

    if (isAvailable) {
      await blockchain.registerCompany(COMPANY_ID);
      log.info(`✅ Company ${COMPANY_ID} registered`);
    }
  } catch (error) {
    log.error('Blockchain initialization error:', error);
  }
};

// Create minimal Elysia app
const app = new Elysia()
  .get('/', () => ({
    status: 'success',
    message: 'Minimal Blockchain Server',
    company: COMPANY_ID,
    blockchain: 'Ethereum',
    timestamp: new Date().toISOString(),
  }))
  .get('/blockchain/status', async () => {
    try {
      const isAvailable = await blockchain.initialize();
      return {
        status: 'success',
        blockchain: {
          available: isAvailable,
          network: 'Hardhat Local',
          chainId: 1337,
        },
        company: COMPANY_ID,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Blockchain unavailable',
        error: (error as Error).message,
      };
    }
  })
  .post('/blockchain/test', async ({ body }) => {
    try {
      const success = await blockchain.submitTransaction({
        type: 'RESERVE_STATION',
        data: { stationId: 1, userId: 'test-user' },
      });

      return {
        status: 'success',
        message: 'Test transaction submitted',
        success,
        company: COMPANY_ID,
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Transaction failed',
        error: (error as Error).message,
      };
    }
  });

// Start server
initBlockchain()
  .then(() => {
    app.listen(SERVER_PORT, () => {
      log.info(
        `🌐 Minimal blockchain server listening on http://localhost:${SERVER_PORT}`,
      );
      log.info(`🏢 Company: ${COMPANY_ID}`);
    });
  })
  .catch(error => {
    log.error('💥 Failed to start server:', error);
    process.exit(1);
  });
