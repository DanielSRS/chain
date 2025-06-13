import { Elysia, t } from 'elysia';
import { EthereumConsensus } from './utils/ethereum-consensus.ts';
import { Logger } from './utils/logger.ts';
import { mqttClient } from './mqtt-server.ts';
import ip from 'ip';
import { STATIONS } from './data/data.ts';

const log = Logger.extend('BlockchainServer');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000');
const COMPANY_ID = process.env.COMPANY_ID || 'company-' + process.pid;

// Initialize Ethereum consensus system
const blockchain = new EthereumConsensus();

// Simple startup without XState complexity
async function initializeBlockchainServer() {
  log.info(`🏢 Starting blockchain server for company: ${COMPANY_ID}`);

  // Initialize blockchain connection
  const blockchainAvailable = await blockchain.initialize();

  if (!blockchainAvailable) {
    log.error('❌ Blockchain initialization failed - no fallbacks allowed');
    throw new Error('Blockchain connection required for operation');
  }

  log.info('✅ Blockchain consensus system initialized');

  // Register company on blockchain
  try {
    await blockchain.registerCompany(COMPANY_ID);
    log.info(`✅ Company ${COMPANY_ID} registered on blockchain`);
  } catch (error) {
    log.error('❌ Failed to register company:', error);
    throw error;
  }

  // Register stations on blockchain
  for (const stationId in STATIONS) {
    const station = STATIONS[stationId];
    try {
      await blockchain.registerStation(COMPANY_ID);
      log.info(`✅ Station ${station.id} registered on blockchain`);
    } catch (error) {
      log.error('❌ Failed to register station:', (error as Error).message);
      throw error;
    }
  }

  // Set up blockchain event listeners
  blockchain.onStationRegistered((stationId, companyId) => {
    log.info(`📡 Station registered: ${stationId} by ${companyId}`);
  });

  blockchain.onReservationCreated((reservationId, stationId) => {
    log.info(
      `📡 Reservation created: ${reservationId} for station ${stationId}`,
    );
  });

  blockchain.onChargingCompleted((reservationId, chargeAmount) => {
    log.info(
      `📡 Charging completed: ${reservationId}, amount: ${chargeAmount}`,
    );
  });

  log.info(
    `🚀 Blockchain server initialized for ${COMPANY_ID} at ${ip.address()}:${SERVER_PORT}`,
  );
  log.info(
    `📊 MQTT client status: ${mqttClient ? 'Connected' : 'Disconnected'}`,
  );
}

// Create the Elysia application with blockchain integration
const app = new Elysia()
  .decorate('blockchain', blockchain)
  .decorate('mqttClient', mqttClient)
  .decorate('companyId', COMPANY_ID)

  // Health check endpoint
  .get('/', () => ({
    status: 'success',
    message: 'Blockchain-Enabled EV Charging Server',
    company: COMPANY_ID,
    blockchain: 'Ethereum',
    consensus: 'Smart Contract',
    timestamp: new Date().toISOString(),
  }))

  // Blockchain status endpoint
  .get('/blockchain/status', async ({ blockchain: blockchainService }) => {
    try {
      // Ensure blockchain is properly initialized (no fallbacks)
      const isAvailable = await blockchainService.initialize();

      if (!isAvailable) {
        throw new Error('Blockchain not available');
      }

      return {
        status: 'success',
        blockchain: {
          available: true,
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

  // Submit blockchain transaction
  .post(
    '/blockchain/transaction',
    async ({ body, blockchain: blockchainService }) => {
      const { type, data } = body;
      log.info(`📡 Received blockchain transaction: ${type}`, data);

      try {
        const success = await blockchainService.submitTransaction({
          type,
          data,
        });

        if (success) {
          log.info(`✅ Transaction ${type} submitted successfully`);
          return {
            status: 'success',
            message: `Transaction ${type} submitted to blockchain`,
            transactionType: type,
            company: COMPANY_ID,
          };
        } else {
          log.error(`❌ Transaction ${type} failed`);
          return {
            status: 'error',
            message: `Transaction ${type} failed`,
            transactionType: type,
          };
        }
      } catch (error) {
        log.error(`💥 Transaction ${type} error:`, error);
        return {
          status: 'error',
          message: 'Transaction failed',
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        type: t.Union([
          t.Literal('RESERVE_STATION'),
          t.Literal('CANCEL_RESERVATION'),
          t.Literal('CHARGE'),
          t.Literal('PAYMENT'),
          t.Literal('CONFIRM'),
          t.Literal('REJECT'),
        ]),
        data: t.Any(),
      }),
    },
  )

  // Station reservation endpoint
  .post(
    '/reserve',
    async ({ body, blockchain: blockchainService }) => {
      const { stationId, userId, startTime, endTime } = body;

      try {
        // Create reservation directly on blockchain
        const actualReservationId = await blockchainService.createReservation(
          stationId,
          startTime || Date.now(),
          endTime || Date.now() + 2 * 60 * 60 * 1000,
        );

        return {
          status: 'success',
          message: `Station ${stationId} reserved for user ${userId}`,
          reservationId: actualReservationId,
          company: COMPANY_ID,
        };
      } catch (error) {
        return {
          status: 'error',
          message: 'Reservation failed',
          error: (error as Error).message,
        };
      }
    },
    {
      body: t.Object({
        stationId: t.Number(),
        userId: t.String(),
        startTime: t.Optional(t.Number()),
        endTime: t.Optional(t.Number()),
      }),
    },
  )

  // Company information
  .get('/company', () => ({
    id: COMPANY_ID,
    name: `EV Charging Company ${COMPANY_ID}`,
    stations: Object.keys(STATIONS).length,
    blockchain: 'Ethereum',
    consensus: 'Smart Contract',
  }))

  // Error handling
  .onError(({ error, code }) => {
    log.error(`API Error [${code}]:`, error);
    return {
      status: 'error',
      message: 'Internal server error',
      code,
    };
  });

// Export blockchain instance for use in other modules
export { blockchain, COMPANY_ID };

// Initialize and start server
initializeBlockchainServer()
  .then(() => {
    app.listen(SERVER_PORT, () => {
      log.info(
        `🌐 Blockchain server listening on http://localhost:${SERVER_PORT}`,
      );
      log.info(`🏢 Company: ${COMPANY_ID}`);
      log.info(`🔗 Blockchain: Ethereum (Hardhat Local)`);
    });
  })
  .catch(error => {
    log.error('💥 Failed to initialize blockchain server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('🛑 Shutting down blockchain server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('🛑 Shutting down blockchain server...');
  process.exit(0);
});
