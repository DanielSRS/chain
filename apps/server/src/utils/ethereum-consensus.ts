import { ethers } from 'ethers';
import { Logger } from './logger.ts';

const log = Logger.extend('EthereumConsensus');

export interface BlockchainTransaction {
  type:
    | 'RESERVE_STATION'
    | 'CANCEL_RESERVATION'
    | 'CHARGE'
    | 'PAYMENT'
    | 'CONFIRM'
    | 'REJECT';
  data: {
    stationId?: number;
    userId?: string;
    startTime?: number;
    endTime?: number;
    chargeAmount?: number;
    reservationId?: number;
  };
}

export interface BlockchainConfig {
  contractAddress?: string;
  privateKey?: string;
  rpcUrl?: string;
}

export class EthereumConsensus {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract | null = null;
  private contractAbi: ethers.ContractInterface;

  constructor(config: BlockchainConfig = {}) {
    // Initialize provider (Hardhat local network)
    this.provider = new ethers.providers.JsonRpcProvider(
      config.rpcUrl || 'http://localhost:8545',
    );

    // Initialize wallet with private key or default Hardhat account
    this.wallet = new ethers.Wallet(
      config.privateKey ||
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider,
    );

    // Load contract ABI (will be compiled later)
    this.contractAbi = [
      {
        inputs: [{ internalType: 'string', name: 'companyId', type: 'string' }],
        name: 'registerCompany',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [{ internalType: 'string', name: 'companyId', type: 'string' }],
        name: 'registerStation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'stationId', type: 'uint256' },
          { internalType: 'uint256', name: 'startTime', type: 'uint256' },
          { internalType: 'uint256', name: 'endTime', type: 'uint256' },
        ],
        name: 'createReservation',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'reservationId', type: 'uint256' },
        ],
        name: 'startCharging',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'reservationId', type: 'uint256' },
          { internalType: 'uint256', name: 'chargeAmount', type: 'uint256' },
        ],
        name: 'completeCharging',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'reservationId', type: 'uint256' },
        ],
        name: 'processPayment',
        outputs: [],
        stateMutability: 'payable',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'stationId', type: 'uint256' },
        ],
        name: 'getStation',
        outputs: [
          {
            components: [
              { internalType: 'uint256', name: 'id', type: 'uint256' },
              { internalType: 'string', name: 'companyId', type: 'string' },
              { internalType: 'bool', name: 'isAvailable', type: 'bool' },
              { internalType: 'address', name: 'owner', type: 'address' },
            ],
            internalType: 'struct ChargingConsensus.Station',
            name: '',
            type: 'tuple',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        inputs: [
          { internalType: 'uint256', name: 'reservationId', type: 'uint256' },
        ],
        name: 'getReservation',
        outputs: [
          {
            components: [
              { internalType: 'uint256', name: 'stationId', type: 'uint256' },
              { internalType: 'address', name: 'user', type: 'address' },
              { internalType: 'uint256', name: 'startTime', type: 'uint256' },
              { internalType: 'uint256', name: 'endTime', type: 'uint256' },
              { internalType: 'bool', name: 'isActive', type: 'bool' },
              {
                internalType: 'uint256',
                name: 'chargeAmount',
                type: 'uint256',
              },
              { internalType: 'bool', name: 'isPaid', type: 'bool' },
            ],
            internalType: 'struct ChargingConsensus.Reservation',
            name: '',
            type: 'tuple',
          },
        ],
        stateMutability: 'view',
        type: 'function',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'stationId',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'string',
            name: 'companyId',
            type: 'string',
          },
          {
            indexed: false,
            internalType: 'address',
            name: 'owner',
            type: 'address',
          },
        ],
        name: 'StationRegistered',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'reservationId',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'stationId',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'address',
            name: 'user',
            type: 'address',
          },
        ],
        name: 'ReservationCreated',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'reservationId',
            type: 'uint256',
          },
        ],
        name: 'ChargingStarted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'reservationId',
            type: 'uint256',
          },
          {
            indexed: false,
            internalType: 'uint256',
            name: 'chargeAmount',
            type: 'uint256',
          },
        ],
        name: 'ChargingCompleted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: 'uint256',
            name: 'reservationId',
            type: 'uint256',
          },
        ],
        name: 'PaymentProcessed',
        type: 'event',
      },
    ];

    // Contract will be initialized after deployment
    if (config.contractAddress) {
      this.contract = new ethers.Contract(
        config.contractAddress,
        this.contractAbi,
        this.wallet,
      );
    }
  }

  async initialize() {
    try {
      // Connect to the network - no fallback allowed
      await this.provider.getNetwork();
      log.info('✅ Connected to Ethereum network');

      // Deploy or connect to contract - required for operation
      if (!this.contract) {
        await this.deployContract();
      }

      return true;
    } catch (error) {
      log.error('❌ Failed to connect to Ethereum network:', error);
      throw new Error('Blockchain connection required - no fallbacks allowed');
    }
  }

  async deployContract(): Promise<string> {
    try {
      // Check if contract is already deployed at the expected address
      const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'; // Default Hardhat contract address

      // Try to connect to existing contract
      const testContract = new ethers.Contract(
        contractAddress,
        this.contractAbi,
        this.wallet,
      );

      // Test if contract exists by calling a view function
      try {
        await testContract.getStation(1);
        this.contract = testContract;
        log.info(`✅ Connected to existing contract at ${contractAddress}`);
        return contractAddress;
      } catch (error) {
        // Check if this is a contract-level revert (expected for non-existent station)
        // vs a network-level error (contract doesn't exist)
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        if (
          errorMessage.includes('call revert exception') ||
          errorMessage.includes('revert')
        ) {
          // This is expected - station 1 doesn't exist yet, but contract is deployed
          this.contract = testContract;
          log.info(`✅ Connected to existing contract at ${contractAddress}`);
          return contractAddress;
        } else {
          log.warn(
            '⚠️ Contract not found at expected address, contract must be deployed first',
          );
          throw new Error(
            'Smart contract not deployed. Please deploy ChargingConsensus.sol to the blockchain first.',
          );
        }
      }
    } catch (error) {
      log.error('Failed to connect to contract:', error);
      throw error;
    }
  }

  async registerCompany(companyId: string): Promise<void> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.registerCompany(companyId);
      await tx.wait();
      log.info(`✅ Company ${companyId} registered on blockchain`);
    } catch (error) {
      log.error('Failed to register company:', error);
      throw error;
    }
  }

  async registerStation(companyId: string): Promise<number> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.registerStation(companyId);
      const receipt = await tx.wait();

      // Extract station ID from event logs
      const event = receipt.events?.find(
        (e: { event: unknown }) => e.event === 'StationRegistered',
      );
      const stationId = event?.args?.stationId?.toNumber() || 0;

      log.info(`✅ Station ${stationId} registered for company ${companyId}`);
      return stationId;
    } catch (error) {
      log.error('Failed to register station:', error);
      throw error;
    }
  }

  async createReservation(
    stationId: number,
    startTime: number,
    endTime: number,
  ): Promise<number> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.createReservation(
        stationId,
        startTime,
        endTime,
      );
      const receipt = await tx.wait();

      // Extract reservation ID from event logs
      const event = receipt.events?.find(
        (e: { event: unknown }) => e.event === 'ReservationCreated',
      );
      const reservationId = event?.args?.reservationId?.toNumber() || 0;

      log.info(
        `✅ Reservation ${reservationId} created for station ${stationId}`,
      );
      return reservationId;
    } catch (error) {
      log.error('Failed to create reservation:', error);
      throw error;
    }
  }

  async startCharging(reservationId: number): Promise<void> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.startCharging(reservationId);
      await tx.wait();
      log.info(`✅ Charging started for reservation ${reservationId}`);
    } catch (error) {
      log.error('Failed to start charging:', error);
      throw error;
    }
  }

  async completeCharging(
    reservationId: number,
    chargeAmount: number,
  ): Promise<void> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.completeCharging(
        reservationId,
        chargeAmount,
      );
      await tx.wait();
      log.info(
        `✅ Charging completed for reservation ${reservationId}, amount: ${chargeAmount}`,
      );
    } catch (error) {
      log.error('Failed to complete charging:', error);
      throw error;
    }
  }

  async processPayment(reservationId: number, amount: number): Promise<void> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      const tx = await this.contract.processPayment(reservationId, {
        value: ethers.utils.parseEther(amount.toString()),
      });
      await tx.wait();
      log.info(`✅ Payment processed for reservation ${reservationId}`);
    } catch (error) {
      log.error('Failed to process payment:', error);
      throw error;
    }
  }

  async getStation(stationId: number) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      return await this.contract.getStation(stationId);
    } catch (error) {
      log.error('Failed to get station:', error);
      throw error;
    }
  }

  async getReservation(reservationId: number) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      return await this.contract.getReservation(reservationId);
    } catch (error) {
      log.error('Failed to get reservation:', error);
      throw error;
    }
  }

  // Method to submit transactions - replaces Paxos consensus
  async submitTransaction(
    transaction: BlockchainTransaction,
  ): Promise<boolean> {
    log.info('📝 Submitting transaction to blockchain:', transaction);

    try {
      switch (transaction.type) {
        case 'RESERVE_STATION':
          if (
            transaction.data.stationId &&
            transaction.data.startTime &&
            transaction.data.endTime
          ) {
            await this.createReservation(
              transaction.data.stationId,
              transaction.data.startTime,
              transaction.data.endTime,
            );
          }
          break;

        case 'CHARGE':
          if (transaction.data.reservationId && transaction.data.chargeAmount) {
            await this.completeCharging(
              transaction.data.reservationId,
              transaction.data.chargeAmount,
            );
          }
          break;

        case 'PAYMENT':
          if (transaction.data.reservationId && transaction.data.chargeAmount) {
            await this.processPayment(
              transaction.data.reservationId,
              transaction.data.chargeAmount,
            );
          }
          break;

        case 'CANCEL_RESERVATION':
          // Implementation for canceling reservations
          throw new Error('CANCEL_RESERVATION not implemented on blockchain');

        case 'CONFIRM':
          // Implementation for confirmation
          throw new Error('CONFIRM transaction not implemented on blockchain');

        case 'REJECT':
          // Implementation for rejection
          throw new Error('REJECT transaction not implemented on blockchain');

        default:
          throw new Error(`Unsupported transaction type: ${transaction.type}`);
      }

      return true;
    } catch (error) {
      log.error('Failed to submit transaction:', error);
      return false;
    }
  }

  // Event listeners for real-time updates
  onStationRegistered(
    callback: (stationId: number, companyId: string, owner: string) => void,
  ) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }
    this.contract.on('StationRegistered', callback);
  }

  onReservationCreated(
    callback: (reservationId: number, stationId: number, user: string) => void,
  ) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }
    this.contract.on('ReservationCreated', callback);
  }

  onChargingCompleted(
    callback: (reservationId: number, chargeAmount: number) => void,
  ) {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }
    this.contract.on('ChargingCompleted', callback);
  }
}
