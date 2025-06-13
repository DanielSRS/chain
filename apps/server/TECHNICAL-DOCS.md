# 🔧 Documentação Técnica Detalhada - Servidor EV Blockchain

## 📋 Índice Técnico

1. [Stack Tecnológico](#stack-tecnológico)
2. [Implementação do Blockchain](#implementação-do-blockchain)
3. [Padrões de Arquitetura](#padrões-de-arquitetura)
4. [Fluxos de Transação](#fluxos-de-transação)
5. [Tratamento de Erros](#tratamento-de-erros)
6. [Performance e Otimização](#performance-e-otimização)
7. [Segurança](#segurança)
8. [Testes](#testes)
9. [Monitoramento](#monitoramento)
10. [Troubleshooting](#troubleshooting)

---

## 💻 Stack Tecnológico

### Core Technologies

| Tecnologia     | Versão  | Uso                     | Justificativa                      |
| -------------- | ------- | ----------------------- | ---------------------------------- |
| **Bun**        | Latest  | JavaScript Runtime      | Performance superior ao Node.js    |
| **Elysia**     | Latest  | Web Framework           | TypeScript-first, alta performance |
| **Ethereum**   | -       | Blockchain Platform     | Padrão da indústria, maturidade    |
| **Hardhat**    | ^2.24.2 | Development Framework   | Tooling completo para Ethereum     |
| **ethers.js**  | ^5.7.2  | Blockchain Interaction  | Biblioteca padrão Ethereum         |
| **Solidity**   | ^0.8.19 | Smart Contract Language | Linguagem nativa Ethereum          |
| **MQTT**       | 3.1.1   | IoT Communication       | Protocolo ideal para IoT/devices   |
| **TypeScript** | Latest  | Language                | Type safety e developer experience |
| **Zod**        | 3.24.2  | Runtime Validation      | Schema validation TypeScript-first |

### Dependencies Overview

```typescript
// Core framework
import { Elysia } from 'elysia';

// Blockchain interaction
import { ethers } from 'ethers';

// MQTT for IoT devices
import Paho from 'paho-mqtt';

// Validation and types
import { z } from 'zod';

// Utilities
import ip from 'ip';
import { Logger } from 'react-native-logs';
```

---

## ⛓️ Implementação do Blockchain

### Smart Contract Architecture

```solidity
// ChargingConsensus.sol - Contrato principal
contract ChargingConsensus {
    // Estado global do sistema
    mapping(uint256 => Station) public stations;
    mapping(uint256 => Reservation) public reservations;
    mapping(string => address) public companies;

    uint256 public stationCounter;
    uint256 public reservationCounter;

    // Modificadores de segurança
    modifier onlyStationOwner(uint256 stationId) {
        require(stations[stationId].owner == msg.sender, "Not station owner");
        _;
    }

    modifier onlyCompany(string memory companyId) {
        require(companies[companyId] == msg.sender, "Not authorized company");
        _;
    }

    // Ciclo de vida da reserva
    function createReservation(uint256 stationId, uint256 startTime, uint256 endTime) external {
        require(stations[stationId].isAvailable, "Station not available");
        require(startTime < endTime, "Invalid time range");

        reservationCounter++;
        reservations[reservationCounter] = Reservation({
            stationId: stationId,
            user: msg.sender,
            startTime: startTime,
            endTime: endTime,
            isActive: true,
            chargeAmount: 0,
            isPaid: false
        });

        stations[stationId].isAvailable = false;
        emit ReservationCreated(reservationCounter, stationId, msg.sender);
    }
}
```

### Ethereum Service Implementation

```typescript
export class EthereumConsensus {
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract | null = null;

  constructor(config: BlockchainConfig = {}) {
    // Configuração da conexão
    this.provider = new ethers.providers.JsonRpcProvider(
      config.rpcUrl || 'http://localhost:8545',
    );

    this.wallet = new ethers.Wallet(
      config.privateKey ||
        '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
      this.provider,
    );

    // ABI do contrato (inline para simplificação)
    this.contractAbi = [
      /* ABI completa aqui */
    ];
  }

  async initialize(): Promise<boolean> {
    try {
      // Verificar conexão com a rede
      const network = await this.provider.getNetwork();
      log.info(`🔗 Connected to blockchain network: ${network.chainId}`);

      // Conectar ao contrato (se já deployed)
      if (this.contractAddress) {
        this.contract = new ethers.Contract(
          this.contractAddress,
          this.contractAbi,
          this.wallet,
        );
        log.info(`📄 Contract connected at: ${this.contractAddress}`);
      }

      return true;
    } catch (error) {
      log.error('Failed to initialize blockchain connection:', error);
      return false;
    }
  }

  // Método principal que substitui o consenso Paxos
  async submitTransaction(
    transaction: BlockchainTransaction,
  ): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Blockchain contract not initialized - no mocks allowed');
    }

    try {
      switch (transaction.type) {
        case 'RESERVE_STATION':
          await this.createReservation(
            transaction.data.stationId!,
            transaction.data.startTime!,
            transaction.data.endTime!,
          );
          return true;

        case 'CHARGE':
          await this.completeCharging(
            transaction.data.reservationId!,
            transaction.data.chargeAmount!,
          );
          return true;

        case 'PAYMENT':
          await this.processPayment(
            transaction.data.reservationId!,
            transaction.data.chargeAmount!,
          );
          return true;

        default:
          throw new Error(`Unknown transaction type: ${transaction.type}`);
      }
    } catch (error) {
      log.error('Transaction submission failed:', error);
      return false;
    }
  }
}
```

### Event Handling

```typescript
// Setup de listeners para eventos em tempo real
async setupEventListeners() {
  if (!this.contract) return;

  // Listener para novas reservas
  this.contract.on('ReservationCreated', (reservationId, stationId, user) => {
    log.info(`📡 New reservation: ${reservationId} for station ${stationId}`);
    this.notifyLocalSystem({
      type: 'RESERVATION_CREATED',
      reservationId: reservationId.toNumber(),
      stationId: stationId.toNumber(),
      user: user
    });
  });

  // Listener para início de recarga
  this.contract.on('ChargingStarted', (reservationId) => {
    log.info(`🔋 Charging started for reservation: ${reservationId}`);
    this.notifyLocalSystem({
      type: 'CHARGING_STARTED',
      reservationId: reservationId.toNumber()
    });
  });

  // Listener para recarga completa
  this.contract.on('ChargingCompleted', (reservationId, chargeAmount) => {
    log.info(`✅ Charging completed: ${reservationId}, amount: ${chargeAmount}`);
    this.notifyLocalSystem({
      type: 'CHARGING_COMPLETED',
      reservationId: reservationId.toNumber(),
      chargeAmount: chargeAmount.toNumber()
    });
  });
}

// Sincronização com estado local
private notifyLocalSystem(event: BlockchainEvent) {
  // Atualizar cache local baseado em eventos blockchain
  switch (event.type) {
    case 'RESERVATION_CREATED':
      this.updateLocalStationState(event.stationId, 'reserved');
      break;
    case 'CHARGING_STARTED':
      this.updateLocalStationState(event.stationId, 'charging');
      break;
    case 'CHARGING_COMPLETED':
      this.updateLocalStationState(event.stationId, 'available');
      break;
  }
}
```

---

## 🏗️ Padrões de Arquitetura

### Dependency Injection Pattern

```typescript
// Servidor principal com injeção de dependências
const app = new Elysia()
  .decorate('blockchain', blockchain) // Serviço blockchain
  .decorate('mqttClient', mqttClient) // Cliente MQTT
  .decorate('companyId', COMPANY_ID) // Configuração da empresa
  .decorate('logger', Logger.extend('API')) // Logger contextual

  // Uso nas rotas
  .post('/reserve', async ({ body, blockchain, logger }) => {
    logger.info('Reserve request received:', body);

    const result = await blockchain.submitTransaction({
      type: 'RESERVE_STATION',
      data: body,
    });

    return { success: result };
  });
```

### Repository Pattern (Blockchain + Cache)

```typescript
interface StationRepository {
  getById(id: number): Promise<Station>;
  updateState(id: number, state: StationState): Promise<void>;
  findAvailable(location: Location, radius: number): Promise<Station[]>;
}

class HybridStationRepository implements StationRepository {
  constructor(
    private blockchain: EthereumConsensus,
    private cache: LocalCache,
  ) {}

  async getById(id: number): Promise<Station> {
    // Primeiro verificar cache local
    const cached = this.cache.getStation(id);
    if (cached && this.isCacheFresh(cached)) {
      return cached;
    }

    // Buscar fonte autoritativa (blockchain)
    const blockchainStation = await this.blockchain.getStation(id);

    // Atualizar cache
    this.cache.setStation(id, blockchainStation);

    return blockchainStation;
  }

  async updateState(id: number, state: StationState): Promise<void> {
    // Sempre atualizar blockchain primeiro
    await this.blockchain.updateStationState(id, state);

    // Cache será atualizado via eventos
  }
}
```

### Command Pattern para Transações

```typescript
interface Command {
  execute(): Promise<boolean>;
  rollback(): Promise<void>;
}

class ReserveStationCommand implements Command {
  constructor(
    private blockchain: EthereumConsensus,
    private stationId: number,
    private userId: string,
    private startTime: number,
    private endTime: number
  ) {}

  async execute(): Promise<boolean> {
    try {
      const reservationId = await this.blockchain.createReservation(
        this.stationId,
        this.startTime,
        this.endTime
      );

      this.reservationId = reservationId;
      return true;
    } catch (error) {
      log.error('Reserve command failed:', error);
      return false;
    }
  }

  async rollback(): Promise<void> {
    if (this.reservationId) {
      await this.blockchain.cancelReservation(this.reservationId);
    }
  }
}

// Uso no endpoint
.post('/reserve', async ({ body, blockchain }) => {
  const command = new ReserveStationCommand(
    blockchain,
    body.stationId,
    body.userId,
    body.startTime,
    body.endTime
  );

  const success = await command.execute();

  if (!success) {
    await command.rollback();
    return { error: 'Reservation failed' };
  }

  return { success: true };
});
```

---

## 🔄 Fluxos de Transação

### Fluxo Completo de Reserva

```typescript
async function reserveStationWorkflow(
  stationId: number,
  userId: string,
  duration: number,
): Promise<ReservationResult> {
  const startTime = Date.now();
  const endTime = startTime + duration;

  // 1. Validação local
  const station = await stationRepository.getById(stationId);
  if (!station.isAvailable) {
    throw new Error('Station not available');
  }

  // 2. Verificar se usuário já tem reserva ativa
  const existingReservations = await blockchain.getActiveReservations(userId);
  if (existingReservations.length > 0) {
    throw new Error('User already has active reservation');
  }

  // 3. Criar transação no blockchain
  const transaction: BlockchainTransaction = {
    type: 'RESERVE_STATION',
    data: { stationId, userId, startTime, endTime },
  };

  // 4. Submeter para consenso blockchain
  const success = await blockchain.submitTransaction(transaction);

  if (!success) {
    throw new Error('Blockchain consensus failed');
  }

  // 5. Aguardar confirmação
  const reservationId = await blockchain.waitForReservationConfirmation(
    stationId,
    userId,
    30000, // timeout 30s
  );

  // 6. Notificar sistema MQTT
  await mqttClient.publish(`stations/${stationId}/commands`, {
    type: 'RESERVE',
    reservationId,
    userId,
    startTime,
    endTime,
  });

  // 7. Atualizar cache local
  await stationRepository.updateState(stationId, 'reserved');

  return {
    success: true,
    reservationId,
    message: 'Station reserved successfully',
  };
}
```

### Fluxo de Recuperação de Falhas

```typescript
class TransactionRecoveryService {
  constructor(
    private blockchain: EthereumConsensus,
    private mqtt: MqttClient,
  ) {}

  async recoverPendingTransactions() {
    // 1. Buscar transações pendentes no blockchain
    const pendingTxs = await this.blockchain.getPendingTransactions();

    for (const tx of pendingTxs) {
      try {
        await this.processRecovery(tx);
      } catch (error) {
        log.error(`Recovery failed for tx ${tx.hash}:`, error);
        await this.markTransactionFailed(tx);
      }
    }
  }

  private async processRecovery(tx: PendingTransaction) {
    const receipt = await this.blockchain.getTransactionReceipt(tx.hash);

    if (receipt.status === 1) {
      // Transação confirmada, sincronizar estado local
      await this.syncLocalState(tx);
    } else {
      // Transação falhou, reverter mudanças locais
      await this.revertLocalChanges(tx);
    }
  }

  private async syncLocalState(tx: PendingTransaction) {
    switch (tx.type) {
      case 'RESERVE_STATION':
        await stationRepository.updateState(tx.data.stationId, 'reserved');
        await this.notifyMqttDevices(tx);
        break;

      case 'COMPLETE_CHARGING':
        await stationRepository.updateState(tx.data.stationId, 'available');
        await this.processPayment(tx.data.reservationId);
        break;
    }
  }
}
```

---

## 🚨 Tratamento de Erros

### Hierarquia de Erros

```typescript
// Base error class
abstract class EVChargingError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;

  constructor(
    message: string,
    public readonly context?: any,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Blockchain-specific errors
class BlockchainError extends EVChargingError {
  readonly code = 'BLOCKCHAIN_ERROR';
  readonly statusCode = 503;
}

class ContractNotDeployedError extends BlockchainError {
  readonly code = 'CONTRACT_NOT_DEPLOYED';
  constructor() {
    super('Smart contract not deployed - no mocks allowed');
  }
}

class InsufficientFundsError extends BlockchainError {
  readonly code = 'INSUFFICIENT_FUNDS';
  readonly statusCode = 402;
}

// Business logic errors
class BusinessLogicError extends EVChargingError {
  readonly code = 'BUSINESS_ERROR';
  readonly statusCode = 400;
}

class StationNotAvailableError extends BusinessLogicError {
  readonly code = 'STATION_NOT_AVAILABLE';
  constructor(stationId: number) {
    super(`Station ${stationId} is not available`, { stationId });
  }
}

class UserAlreadyHasReservationError extends BusinessLogicError {
  readonly code = 'USER_HAS_RESERVATION';
  constructor(userId: string) {
    super(`User ${userId} already has an active reservation`, { userId });
  }
}
```

### Error Handler Middleware

```typescript
const errorHandler = (error: Error) => {
  // Log estruturado do erro
  const errorContext = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...(error instanceof EVChargingError
      ? {
          code: error.code,
          context: error.context,
        }
      : {}),
  };

  log.error('API Error:', errorContext);

  // Resposta padronizada
  if (error instanceof EVChargingError) {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(process.env.NODE_ENV === 'development' && {
            context: error.context,
          }),
        },
      }),
      {
        status: error.statusCode,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Erro interno não mapeado
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};

// Aplicar ao servidor Elysia
const app = new Elysia().onError(errorHandler);
// ... rest of setup
```

### Circuit Breaker Pattern

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold = 5,
    private readonly timeout = 60000, // 1 minuto
    private readonly name = 'default',
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        log.info(`Circuit breaker ${this.name} entering HALF_OPEN state`);
      } else {
        throw new CircuitBreakerOpenError(this.name);
      }
    }

    try {
      const result = await operation();

      if (this.state === 'HALF_OPEN') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      log.warn(
        `Circuit breaker ${this.name} OPENED after ${this.failures} failures`,
      );
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'CLOSED';
    log.info(`Circuit breaker ${this.name} CLOSED - service recovered`);
  }
}

// Uso com blockchain
const blockchainCircuitBreaker = new CircuitBreaker(3, 30000, 'blockchain');

class ResilientEthereumConsensus extends EthereumConsensus {
  async submitTransaction(
    transaction: BlockchainTransaction,
  ): Promise<boolean> {
    return blockchainCircuitBreaker.execute(async () => {
      return super.submitTransaction(transaction);
    });
  }
}
```

---

## ⚡ Performance e Otimização

### Caching Strategy

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MultiLevelCache {
  private memoryCache = new Map<string, CacheEntry<any>>();
  private readonly maxMemoryEntries = 1000;

  constructor(
    private readonly defaultTTL = 300000, // 5 minutos
  ) {}

  async get<T>(key: string): Promise<T | null> {
    // L1: Memory cache
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // L2: Redis cache (se disponível)
    if (process.env.REDIS_URL) {
      const redisData = await this.getFromRedis<T>(key);
      if (redisData) {
        this.setMemory(key, redisData, this.defaultTTL);
        return redisData;
      }
    }

    // L3: Blockchain (fonte autoritativa)
    return null;
  }

  async set<T>(key: string, data: T, ttl = this.defaultTTL): Promise<void> {
    // Definir em todos os níveis
    this.setMemory(key, data, ttl);

    if (process.env.REDIS_URL) {
      await this.setRedis(key, data, ttl);
    }
  }

  private setMemory<T>(key: string, data: T, ttl: number): void {
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      // LRU eviction
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }

    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }
}

// Implementação específica para estações
class StationCacheService {
  constructor(private cache: MultiLevelCache) {}

  async getStation(id: number): Promise<Station | null> {
    const cacheKey = `station:${id}`;

    let station = await this.cache.get<Station>(cacheKey);

    if (!station) {
      // Buscar do blockchain
      station = await blockchain.getStation(id);
      if (station) {
        await this.cache.set(cacheKey, station, 300000); // 5 min TTL
      }
    }

    return station;
  }

  async invalidateStation(id: number): Promise<void> {
    const cacheKey = `station:${id}`;
    await this.cache.delete(cacheKey);
  }

  // Invalidar cache quando eventos blockchain são recebidos
  async handleBlockchainEvent(event: BlockchainEvent): Promise<void> {
    switch (event.type) {
      case 'STATION_UPDATED':
        await this.invalidateStation(event.stationId);
        break;
      case 'RESERVATION_CREATED':
        await this.invalidateStation(event.stationId);
        break;
    }
  }
}
```

### Connection Pooling

```typescript
class EthereumConnectionPool {
  private connections: ethers.providers.JsonRpcProvider[] = [];
  private currentIndex = 0;
  private readonly maxConnections = 5;

  constructor(private rpcUrls: string[]) {
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.maxConnections; i++) {
      const rpcUrl = this.rpcUrls[i % this.rpcUrls.length];
      const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      this.connections.push(provider);
    }
  }

  getConnection(): ethers.providers.JsonRpcProvider {
    const connection = this.connections[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.connections.length;
    return connection;
  }

  async healthCheck(): Promise<boolean[]> {
    const results = await Promise.allSettled(
      this.connections.map(conn => conn.getNetwork()),
    );

    return results.map(result => result.status === 'fulfilled');
  }
}
```

### Batch Operations

```typescript
class BatchedBlockchainOperations {
  private pendingOperations: BlockchainOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly batchSize = 10;
  private readonly batchDelay = 100; // ms

  constructor(private blockchain: EthereumConsensus) {}

  async submitOperation(operation: BlockchainOperation): Promise<void> {
    this.pendingOperations.push(operation);

    if (this.pendingOperations.length >= this.batchSize) {
      await this.processBatch();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(
        () => this.processBatch(),
        this.batchDelay,
      );
    }
  }

  private async processBatch(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    const batch = this.pendingOperations.splice(0, this.batchSize);

    if (batch.length === 0) return;

    try {
      // Processar operações em paralelo quando possível
      const results = await Promise.allSettled(
        batch.map(op => this.executeOperation(op)),
      );

      // Log resultados
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          log.error(`Batch operation ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      log.error('Batch processing failed:', error);
    }
  }

  private async executeOperation(operation: BlockchainOperation): Promise<any> {
    switch (operation.type) {
      case 'UPDATE_STATION_STATUS':
        return this.blockchain.updateStationStatus(
          operation.stationId,
          operation.status,
        );
      case 'PROCESS_PAYMENT':
        return this.blockchain.processPayment(
          operation.reservationId,
          operation.amount,
        );
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }
}
```

---

## 🔒 Segurança

### Rate Limiting

```typescript
class RateLimiter {
  private requests = new Map<string, number[]>();

  constructor(
    private readonly maxRequests = 100,
    private readonly windowMs = 60000, // 1 minuto
  ) {}

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const requests = this.requests.get(identifier) || [];

    // Remover requests antigas
    const validRequests = requests.filter(time => now - time < this.windowMs);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(identifier, validRequests);

    return true;
  }

  getRemainingRequests(identifier: string): number {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const validRequests = requests.filter(time => now - time < this.windowMs);

    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

// Middleware para Elysia
const rateLimitMiddleware = (limiter: RateLimiter) => {
  return async ({ request, set }: any) => {
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!limiter.isAllowed(clientIP)) {
      set.status = 429;
      return {
        error: 'Rate limit exceeded',
        retryAfter: 60,
      };
    }
  };
};
```

### Input Validation

```typescript
import { z } from 'zod';

// Schemas de validação
const ReservationSchema = z
  .object({
    stationId: z.number().int().positive(),
    userId: z.string().min(1).max(100),
    startTime: z.number().int().positive(),
    endTime: z.number().int().positive(),
  })
  .refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time',
  });

const PaymentSchema = z.object({
  reservationId: z.number().int().positive(),
  amount: z.number().positive(),
  currency: z.literal('ETH'),
  signature: z.string().min(1),
});

// Middleware de validação
const validateBody = (schema: z.ZodSchema) => {
  return ({ body, set }: any) => {
    try {
      return schema.parse(body);
    } catch (error) {
      set.status = 400;
      return {
        error: 'Validation failed',
        details: error.issues,
      };
    }
  };
};

// Uso nas rotas
app.post(
  '/reserve',
  validateBody(ReservationSchema),
  async ({ body, blockchain }) => {
    // body já está validado
    return await blockchain.submitTransaction({
      type: 'RESERVE_STATION',
      data: body,
    });
  },
);
```

### Signature Verification

```typescript
class SignatureVerifier {
  constructor(private expectedSigner?: string) {}

  verifyTransactionSignature(
    transaction: BlockchainTransaction,
    signature: string,
  ): boolean {
    try {
      // Criar hash da transação
      const message = this.createTransactionHash(transaction);

      // Recuperar endereço do assinante
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);

      // Verificar se é o assinante esperado
      if (this.expectedSigner) {
        return (
          recoveredAddress.toLowerCase() === this.expectedSigner.toLowerCase()
        );
      }

      // Verificar se o endereço tem permissões (exemplo: é uma empresa registrada)
      return this.isAuthorizedAddress(recoveredAddress);
    } catch (error) {
      log.error('Signature verification failed:', error);
      return false;
    }
  }

  private createTransactionHash(transaction: BlockchainTransaction): string {
    const payload = {
      type: transaction.type,
      data: transaction.data,
      timestamp: Math.floor(Date.now() / 1000),
    };

    return ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(JSON.stringify(payload)),
    );
  }

  private async isAuthorizedAddress(address: string): Promise<boolean> {
    // Verificar no smart contract se o endereço é uma empresa registrada
    const isRegistered = await blockchain.isRegisteredCompany(address);
    return isRegistered;
  }
}
```

---

## 🧪 Testes

### Test Structure

```typescript
// test/integration/blockchain.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { EthereumConsensus } from '../src/utils/ethereum-consensus';

describe('Blockchain Integration Tests', () => {
  let blockchain: EthereumConsensus;
  let testProvider: any;

  beforeAll(async () => {
    // Setup test blockchain
    testProvider = await startTestBlockchain();
    blockchain = new EthereumConsensus({
      rpcUrl: 'http://localhost:8545',
      privateKey: TEST_PRIVATE_KEY,
    });

    await blockchain.initialize();
    await blockchain.deployContract();
  });

  afterAll(async () => {
    await testProvider.close();
  });

  describe('Station Management', () => {
    it('should register a new station', async () => {
      const stationId = await blockchain.registerStation('test-company');

      expect(stationId).toBeGreaterThan(0);

      const station = await blockchain.getStation(stationId);
      expect(station.companyId).toBe('test-company');
      expect(station.isAvailable).toBe(true);
    });

    it('should prevent duplicate station registration', async () => {
      await expect(blockchain.registerStation('test-company')).rejects.toThrow(
        'Company already has station',
      );
    });
  });

  describe('Reservation Workflow', () => {
    let stationId: number;

    beforeAll(async () => {
      stationId = await blockchain.registerStation('test-company-2');
    });

    it('should create reservation successfully', async () => {
      const startTime = Date.now();
      const endTime = startTime + 3600000; // 1 hour

      const reservationId = await blockchain.createReservation(
        stationId,
        startTime,
        endTime,
      );

      expect(reservationId).toBeGreaterThan(0);

      const reservation = await blockchain.getReservation(reservationId);
      expect(reservation.stationId).toBe(stationId);
      expect(reservation.isActive).toBe(true);
    });

    it('should prevent double booking', async () => {
      const startTime = Date.now();
      const endTime = startTime + 3600000;

      await expect(
        blockchain.createReservation(stationId, startTime, endTime),
      ).rejects.toThrow('Station not available');
    });
  });
});
```

### Load Testing

```typescript
// test/load/station-load.test.ts
import { describe, it } from 'bun:test';

describe('Load Tests', () => {
  it('should handle concurrent reservations', async () => {
    const concurrentUsers = 50;
    const promises = [];

    for (let i = 0; i < concurrentUsers; i++) {
      promises.push(
        fetch('http://localhost:3000/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stationId: Math.floor(Math.random() * 10) + 1,
            userId: `user-${i}`,
          }),
        }),
      );
    }

    const results = await Promise.allSettled(promises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.length - successful;

    console.log(`Successful: ${successful}, Failed: ${failed}`);

    // Expectativa: pelo menos 80% de sucesso
    expect(successful / results.length).toBeGreaterThan(0.8);
  });

  it('should maintain performance under load', async () => {
    const startTime = Date.now();
    const requests = 1000;

    const promises = Array.from({ length: requests }, (_, i) =>
      fetch(`http://localhost:3000/stations/${(i % 10) + 1}`),
    );

    await Promise.all(promises);

    const duration = Date.now() - startTime;
    const rps = requests / (duration / 1000);

    console.log(`RPS: ${rps.toFixed(2)}`);

    // Expectativa: pelo menos 100 RPS
    expect(rps).toBeGreaterThan(100);
  });
});
```

---

## 📊 Monitoramento

### Metrics Collection

```typescript
class MetricsCollector {
  private metrics = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  increment(metric: string, value = 1): void {
    const current = this.metrics.get(metric) || 0;
    this.metrics.set(metric, current + value);
  }

  gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }

  histogram(metric: string, value: number): void {
    const values = this.histograms.get(metric) || [];
    values.push(value);

    // Manter apenas os últimos 1000 valores
    if (values.length > 1000) {
      values.shift();
    }

    this.histograms.set(metric, values);
  }

  getMetrics(): Record<string, any> {
    const result: Record<string, any> = {};

    // Métricas simples
    for (const [key, value] of this.metrics) {
      result[key] = value;
    }

    // Histogramas com estatísticas
    for (const [key, values] of this.histograms) {
      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        result[`${key}_avg`] = values.reduce((a, b) => a + b) / values.length;
        result[`${key}_p50`] = sorted[Math.floor(sorted.length * 0.5)];
        result[`${key}_p95`] = sorted[Math.floor(sorted.length * 0.95)];
        result[`${key}_p99`] = sorted[Math.floor(sorted.length * 0.99)];
      }
    }

    return result;
  }
}

const metrics = new MetricsCollector();

// Middleware de métricas
const metricsMiddleware = () => {
  return async ({ request, set }: any, next: Function) => {
    const startTime = Date.now();
    const method = request.method;
    const path = new URL(request.url).pathname;

    try {
      await next();

      metrics.increment(`http_requests_total`);
      metrics.increment(`http_requests_${method.toLowerCase()}`);
      metrics.histogram(`http_request_duration_ms`, Date.now() - startTime);

      if (set.status >= 200 && set.status < 300) {
        metrics.increment(`http_requests_success`);
      } else {
        metrics.increment(`http_requests_error`);
      }
    } catch (error) {
      metrics.increment(`http_requests_error`);
      throw error;
    }
  };
};

// Endpoint de métricas
app.get('/metrics', () => {
  return {
    timestamp: new Date().toISOString(),
    ...metrics.getMetrics(),
    blockchain: {
      connected: blockchain.isConnected(),
      blockNumber: blockchain.getCurrentBlockNumber(),
      gasPrice: blockchain.getCurrentGasPrice(),
    },
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    },
  };
});
```

### Health Checks

```typescript
interface HealthCheck {
  name: string;
  check(): Promise<boolean>;
  critical: boolean;
}

class HealthChecker {
  private checks: HealthCheck[] = [];

  addCheck(check: HealthCheck): void {
    this.checks.push(check);
  }

  async runChecks(): Promise<HealthStatus> {
    const results = await Promise.allSettled(
      this.checks.map(async check => ({
        name: check.name,
        healthy: await check.check(),
        critical: check.critical,
      })),
    );

    const checks = results.map(result =>
      result.status === 'fulfilled'
        ? result.value
        : { name: 'unknown', healthy: false, critical: true },
    );

    const criticalFailures = checks.filter(c => !c.healthy && c.critical);
    const overallHealth = criticalFailures.length === 0;

    return {
      healthy: overallHealth,
      timestamp: new Date().toISOString(),
      checks: checks.reduce(
        (acc, check) => {
          acc[check.name] = {
            healthy: check.healthy,
            critical: check.critical,
          };
          return acc;
        },
        {} as Record<string, any>,
      ),
    };
  }
}

// Setup health checks
const healthChecker = new HealthChecker();

healthChecker.addCheck({
  name: 'blockchain',
  critical: true,
  check: async () => {
    try {
      await blockchain.provider.getNetwork();
      return true;
    } catch {
      return false;
    }
  },
});

healthChecker.addCheck({
  name: 'mqtt',
  critical: false,
  check: async () => mqttClient.isConnected(),
});

healthChecker.addCheck({
  name: 'database',
  critical: true,
  check: async () => {
    // Verificar se consegue ler/escrever dados
    try {
      await stationRepository.getById(1);
      return true;
    } catch {
      return false;
    }
  },
});

app.get('/health', async () => {
  const health = await healthChecker.runChecks();
  return health;
});
```

---

## 🔧 Troubleshooting

### Common Issues

```typescript
class DiagnosticsService {
  async runDiagnostics(): Promise<DiagnosticReport> {
    const report: DiagnosticReport = {
      timestamp: new Date().toISOString(),
      issues: [],
      recommendations: [],
    };

    // Verificar conexão blockchain
    try {
      const network = await blockchain.provider.getNetwork();
      if (network.chainId !== 1337) {
        report.issues.push({
          severity: 'warning',
          component: 'blockchain',
          message: `Connected to unexpected network: ${network.chainId}`,
          recommendation: 'Verify ETHEREUM_RPC_URL configuration',
        });
      }
    } catch (error) {
      report.issues.push({
        severity: 'critical',
        component: 'blockchain',
        message: 'Cannot connect to blockchain network',
        recommendation: 'Start Hardhat network: npx hardhat node',
      });
    }

    // Verificar smart contract
    if (!blockchain.contract) {
      report.issues.push({
        severity: 'critical',
        component: 'contract',
        message: 'Smart contract not deployed',
        recommendation: 'Deploy contract: npx hardhat run scripts/deploy.js',
      });
    }

    // Verificar MQTT
    if (!mqttClient.isConnected()) {
      report.issues.push({
        severity: 'warning',
        component: 'mqtt',
        message: 'MQTT client not connected',
        recommendation: 'Check MQTT broker configuration',
      });
    }

    // Verificar performance
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > 500 * 1024 * 1024) {
      // 500MB
      report.issues.push({
        severity: 'warning',
        component: 'performance',
        message: 'High memory usage detected',
        recommendation: 'Consider restarting the server or optimizing cache',
      });
    }

    return report;
  }

  async resolveIssue(issueId: string): Promise<boolean> {
    switch (issueId) {
      case 'blockchain_connection':
        return await this.fixBlockchainConnection();
      case 'contract_deployment':
        return await this.deployContract();
      case 'mqtt_connection':
        return await this.reconnectMqtt();
      default:
        return false;
    }
  }

  private async fixBlockchainConnection(): Promise<boolean> {
    try {
      // Tentar reconectar
      await blockchain.initialize();
      return true;
    } catch (error) {
      log.error('Failed to fix blockchain connection:', error);
      return false;
    }
  }

  private async deployContract(): Promise<boolean> {
    try {
      const contractAddress = await blockchain.deployContract();
      log.info(`Contract deployed at: ${contractAddress}`);
      return true;
    } catch (error) {
      log.error('Failed to deploy contract:', error);
      return false;
    }
  }
}

// Endpoint de diagnóstico
app.get('/diagnostics', async () => {
  const diagnostics = new DiagnosticsService();
  return await diagnostics.runDiagnostics();
});

app.post('/diagnostics/resolve/:issueId', async ({ params }) => {
  const diagnostics = new DiagnosticsService();
  const resolved = await diagnostics.resolveIssue(params.issueId);

  return {
    issueId: params.issueId,
    resolved,
    timestamp: new Date().toISOString(),
  };
});
```

### Debugging Tools

```typescript
class DebugService {
  async getSystemState(): Promise<SystemState> {
    return {
      blockchain: {
        connected: blockchain.isConnected(),
        contractAddress: blockchain.contract?.address,
        blockNumber: await blockchain.provider.getBlockNumber(),
        accounts: await blockchain.provider.listAccounts(),
      },
      server: {
        uptime: process.uptime(),
        pid: process.pid,
        version: process.version,
        memoryUsage: process.memoryUsage(),
      },
      cache: {
        stations: stationCache.size(),
        users: userCache.size(),
        reservations: reservationCache.size(),
      },
      mqtt: {
        connected: mqttClient.isConnected(),
        subscriptions: mqttClient.getSubscriptions(),
        messagesSent: mqttClient.getMessagesSent(),
        messagesReceived: mqttClient.getMessagesReceived(),
      },
    };
  }

  async traceTransaction(txHash: string): Promise<TransactionTrace> {
    const receipt = await blockchain.provider.getTransactionReceipt(txHash);
    const transaction = await blockchain.provider.getTransaction(txHash);

    return {
      hash: txHash,
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: transaction.gasPrice.toString(),
      events: receipt.logs.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
      })),
    };
  }

  async simulateTransaction(
    transaction: BlockchainTransaction,
  ): Promise<SimulationResult> {
    try {
      // Simular transação sem fazer commit
      const result = await blockchain.callStatic(transaction);

      return {
        success: true,
        estimatedGas: result.gasEstimate,
        returnValue: result.returnValue,
        events: result.events,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        reason: error.reason,
      };
    }
  }
}

// Endpoints de debug (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  const debugService = new DebugService();

  app.get('/debug/state', () => debugService.getSystemState());

  app.get('/debug/trace/:txHash', ({ params }) =>
    debugService.traceTransaction(params.txHash),
  );

  app.post('/debug/simulate', ({ body }) =>
    debugService.simulateTransaction(body),
  );
}
```

---

Esta documentação técnica fornece uma visão abrangente da implementação, incluindo padrões de arquitetura, otimizações de performance, estratégias de segurança e ferramentas de monitoramento. O sistema está projetado para ser robusto, escalável e mantível, seguindo as melhores práticas da indústria para aplicações blockchain.
