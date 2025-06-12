import './server';
import { EthereumConsensus } from './utils/ethereum-consensus.ts';
import { Logger } from './utils/logger.ts';
import { Elysia, t } from 'elysia';
import { mqttClient } from './mqtt-server.ts';
import ip from 'ip';
import { STATIONS } from './data/data.ts';

const log = Logger.extend('Server');
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3000');
const COMPANY_ID = process.env.COMPANY_ID || 'company-' + process.pid;

// Initialize Ethereum consensus system
const blockchain = new EthereumConsensus();

// Simple startup without XState complexity
async function initializeServer() {
  log.info(`Starting server for company: ${COMPANY_ID}`);

  // Initialize blockchain connection
  const blockchainAvailable = await blockchain.initialize();

  if (blockchainAvailable) {
    log.info('✅ Blockchain consensus system initialized');

    // Register company on blockchain
    try {
      await blockchain.registerCompany(COMPANY_ID);
      log.info(`✅ Company ${COMPANY_ID} registered on blockchain`);
    } catch (error) {
      log.warn('Company may already be registered:', error);
    }

    // Register stations on blockchain
    for (const station of STATIONS) {
      try {
        const stationId = await blockchain.registerStation(COMPANY_ID);
        log.info(
          `✅ Station ${station.id} registered on blockchain with ID: ${stationId}`,
        );
      } catch (error) {
        log.error('Failed to register station:', error);
      }
    }
  } else {
    log.warn('⚠️ Running in mock mode without blockchain');
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
    `🚀 Server initialized for ${COMPANY_ID} at ${ip.address()}:${SERVER_PORT}`,
  );
}

// Export blockchain instance for use in routes
export { blockchain, COMPANY_ID };

// Initialize server
initializeServer().catch(error => {
  log.error('💥 Failed to initialize server:', error);
  process.exit(1);
});

log.info(`🌍 Server address: ${ip.address()}:${SERVER_PORT}`);

const app = new Elysia()
  .decorate('blockchain', blockchain)
  .decorate('mqttClient', mqttClient)
  .get('/', () => 'Hello Elysia - Blockchain Enabled!')
  .post(
    '/blockchain-event',
    async ({ body, blockchain: blockchainService }) => {
      const { event } = body;
      log.info('📡 Received blockchain event:', event);

      // Submit to blockchain instead of state machine
      const success = await blockchainService.submitTransaction({
        type: event.type,
        data: event.data,
      });

      return {
        success,
        message: success
          ? 'Transaction submitted to blockchain'
          : 'Transaction failed',
      };
    },
    {
      body: t.Object({
        event: t.Object({
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
      }),
      response: t.Object({
        success: t.Boolean(),
        message: t.String(),
      }),
    },
  )
  .post(
    '/connect',
    ({ body }) => {
      const { event } = body;
      log.info('connection request:', event);
      return 'Connection request received';
    },
    {
      body: t.Object({
        event: t.Object({
          type: t.Literal('JOIN_GROUP'),
          data: t.Any(),
        }),
      }),
      response: t.String(),
    },
  )
  .listen(SERVER_PORT);

log.info(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
