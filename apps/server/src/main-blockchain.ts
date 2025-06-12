import './server.ts';
import { EthereumConsensus } from './utils/ethereum-consensus.ts';
import { Logger } from './utils/logger.ts';
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
  log.info(`🏢 Starting server for company: ${COMPANY_ID}`);

  // Initialize blockchain connection
  const blockchainAvailable = await blockchain.initialize();

  if (blockchainAvailable) {
    log.info('✅ Blockchain consensus system initialized');

    // Register company on blockchain
    try {
      await blockchain.registerCompany(COMPANY_ID);
      log.info(`✅ Company ${COMPANY_ID} registered on blockchain`);
    } catch (error) {
      log.warn('⚠️  Company may already be registered:', error);
    }

    // Register stations on blockchain
    for (const stationId in STATIONS) {
      const station = STATIONS[stationId];
      try {
        await blockchain.registerStation(COMPANY_ID);
        log.info(`✅ Station ${station.id} registered on blockchain`);
      } catch (error) {
        log.error('❌ Failed to register station:', (error as Error).message);
      }
    }
  } else {
    log.warn('⚠️  Running in mock mode without blockchain');
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
  log.info(
    `📊 MQTT client status: ${mqttClient ? 'Connected' : 'Disconnected'}`,
  );
}

// Export blockchain instance for use in routes
export { blockchain, COMPANY_ID };

// Initialize server
initializeServer().catch(error => {
  log.error('💥 Failed to initialize server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  log.info('🛑 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log.info('🛑 Shutting down server...');
  process.exit(0);
});
