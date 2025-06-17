# Refatoração Arquitetural - Simplificação e Melhores Práticas

## Análise da Complexidade Atual

### ❌ **Problemas Identificados**

#### 1. **Over-engineering**

- **State machines desnecessárias**: `startup.machine.ts` para simples inicialização
- **Abstrações excessivas**: Curry functions onde não necessário
- **Duplicação de protocolos**: TCP + MQTT + REST coexistindo
- **Storage abstraction**: Sistema complexo para necessidades simples

#### 2. **Não seguem padrões da indústria**

- **Blockchain**: Implementação custom em vez de usar libs estabelecidas
- **Consensus**: Paxos implementado from scratch
- **MQTT**: Cliente custom em vez de libs padrão
- **Routing**: Sistema próprio em vez de frameworks estabelecidos

#### 3. **Estrutura confusa**

- **Apps separados**: Car/Server/Shared com boundaries pouco claros
- **Tipos espalhados**: Definições em múltiplos arquivos
- **Lógica misturada**: Business logic nos routes

## 🎯 **Arquitetura Simplificada Proposta**

### **Estrutura Target**

```
apps/
  blockchain-node/          # Cada empresa = um nó blockchain
    src/
      main.ts              # Entry point simples
      blockchain/          # Blockchain engine (lib externa)
      api/                 # REST API (Express/Fastify)
      mqtt/                # MQTT broker integration
      services/            # Business logic
      models/              # Data models

  client-app/              # Interface única (web + terminal)
    src/
      components/          # UI components
      services/            # API clients

shared/
  types/                   # Tipos compartilhados
  utils/                   # Utilitários
```

### **Stack Tecnológico Simplificado**

#### Backend (Blockchain Node)

```typescript
// Usar libs estabelecidas da indústria
- Fastify: API REST (mais simples que Elysia)
- ioredis: Storage/cache distribuído
- mqtt: Client MQTT padrão
- hypercore-protocol: P2P blockchain (ou libp2p)
- leveldb: Persistência local
```

#### Frontend (Client)

```typescript
// Interface unificada
- Next.js: Web interface
- Ink (atual): Terminal interface
- Socket.io: Real-time updates
```

## 🔧 **Implementação Simplificada**

### **1. Blockchain Node (Empresa)**

#### `apps/blockchain-node/src/main.ts`

```typescript
import Fastify from 'fastify';
import { createBlockchain } from './blockchain/engine';
import { setupMQTT } from './mqtt/broker';
import { setupRoutes } from './api/routes';

async function start() {
  const app = Fastify({ logger: true });

  // Inicializar blockchain
  const blockchain = await createBlockchain();

  // Setup MQTT
  const mqtt = await setupMQTT();

  // Setup routes
  await setupRoutes(app, { blockchain, mqtt });

  await app.listen({ port: 3000 });
}

start();
```

#### `apps/blockchain-node/src/blockchain/engine.ts`

```typescript
import { Hypercore } from 'hypercore';
import { createHash } from 'crypto';

export class SimpleBlockchain {
  private chain: Hypercore;
  private peers: Set<string> = new Set();

  async proposeTransaction(tx: Transaction): Promise<boolean> {
    // 1. Broadcast to peers
    const votes = await this.requestVotes(tx);

    // 2. Simple majority consensus
    if (votes.approve > votes.reject) {
      await this.commitTransaction(tx);
      return true;
    }

    return false;
  }

  private async commitTransaction(tx: Transaction) {
    const block = {
      timestamp: Date.now(),
      transaction: tx,
      previousHash: await this.getLastHash(),
      hash: this.calculateHash(tx),
    };

    await this.chain.append(JSON.stringify(block));
    await this.syncWithPeers(block);
  }
}
```

#### `apps/blockchain-node/src/services/reservation.ts`

```typescript
// Business logic separada dos routes
export class ReservationService {
  constructor(
    private blockchain: SimpleBlockchain,
    private stations: StationRegistry,
  ) {}

  async reserveStation(userId: string, stationId: string): Promise<Result> {
    // Validações
    if (!this.stations.isAvailable(stationId)) {
      return { success: false, error: 'Station not available' };
    }

    // Propor transação
    const success = await this.blockchain.proposeTransaction({
      type: 'RESERVE',
      userId,
      stationId,
      timestamp: Date.now(),
    });

    if (success) {
      this.stations.reserve(stationId, userId);
      return { success: true };
    }

    return { success: false, error: 'Consensus failed' };
  }
}
```

#### `apps/blockchain-node/src/api/routes.ts`

```typescript
import { FastifyInstance } from 'fastify';

export async function setupRoutes(
  app: FastifyInstance,
  { blockchain, mqtt }: Services,
) {
  const reservationService = new ReservationService(blockchain, stations);

  // Routes simples e diretas
  app.post('/reserve', async (req, reply) => {
    const { userId, stationId } = req.body;
    const result = await reservationService.reserveStation(userId, stationId);
    return result;
  });

  app.get('/ledger', async () => {
    return blockchain.getPublicLedger();
  });

  app.get('/stations', async () => {
    return stations.getAll();
  });
}
```

### **2. MQTT Integration Simplificado**

#### `apps/blockchain-node/src/mqtt/broker.ts`

```typescript
import mqtt from 'mqtt';

export class MQTTService {
  private client: mqtt.MqttClient;

  constructor(private blockchain: SimpleBlockchain) {
    this.client = mqtt.connect('mqtt://broker:1883');
    this.setupHandlers();
  }

  private setupHandlers() {
    // Car status updates
    this.client.on('message', (topic, message) => {
      if (topic.startsWith('car/')) {
        this.handleCarUpdate(topic, JSON.parse(message.toString()));
      }

      if (topic.startsWith('station/')) {
        this.handleStationUpdate(topic, JSON.parse(message.toString()));
      }
    });
  }

  private async handleCarUpdate(topic: string, data: any) {
    // Update blockchain with car status
    if (data.batteryLevel < 20) {
      await this.suggestStations(data.carId, data.location);
    }
  }
}
```

### **3. Client Simplificado**

#### `apps/client-app/src/services/api.ts`

```typescript
// Client API simples
export class APIClient {
  constructor(private baseURL: string) {}

  async reserveStation(stationId: string): Promise<Result> {
    const response = await fetch(`${this.baseURL}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: this.getCurrentUser().id,
        stationId,
      }),
    });

    return response.json();
  }

  async getStations(): Promise<Station[]> {
    const response = await fetch(`${this.baseURL}/stations`);
    return response.json();
  }

  async getLedger(): Promise<Transaction[]> {
    const response = await fetch(`${this.baseURL}/ledger`);
    return response.json();
  }
}
```

## 🗑️ **O que Remover**

### **Arquivos para Deletar**

```bash
# State machines desnecessárias
apps/server/src/machines/

# Abstrações desnecessárias
apps/server/src/utils/curry.ts
apps/server/src/utils/paxos.ts

# Protocolos obsoletos
apps/server/src/server.ts  # TCP server
apps/shared/src/tcp/       # TCP abstraction

# Storage over-engineered
apps/shared/src/libs/storage/

# Schemas redundantes (usar Zod diretamente)
apps/server/src/schemas/
```

### **Simplificações**

```bash
# Consolidar tipos
apps/shared/src/utils/main.types.ts → shared/types/index.ts

# Simplificar roteamento
apps/server/src/routes/ → Usar Fastify routes diretamente

# Eliminar abstrações desnecessárias
apps/server/src/utils/types.ts → Usar tipos diretos
```

## 📦 **Dependências Simplificadas**

### **Antes (Over-engineered)**

```json
{
  "dependencies": {
    "elysia": "^0.7.0", // Framework muito novo
    "xstate": "^4.38.0", // State machines desnecessárias
    "paho-mqtt": "^1.1.0", // Client MQTT custom
    "zod": "^3.22.0", // OK
    "fp-ts": "^2.16.0" // Functional programming desnecessário
  }
}
```

### **Depois (Industry Standard)**

```json
{
  "dependencies": {
    "fastify": "^4.24.0", // Web framework estável
    "mqtt": "^5.3.0", // Client MQTT padrão
    "hypercore": "^10.16.0", // P2P blockchain
    "leveldb": "^6.2.0", // Persistência
    "ioredis": "^5.3.0", // Cache/pub-sub
    "zod": "^3.22.0" // Validation
  }
}
```

## 🚀 **Plano de Migração**

### **Fase 1: Simplificar Backend**

1. **Criar `blockchain-node`** com Fastify
2. **Implementar blockchain simples** com Hypercore
3. **Migrar business logic** para services
4. **Remover state machines** e abstrações

### **Fase 2: Unificar Client**

1. **Consolidar interfaces** (terminal + web)
2. **Simplificar API client**
3. **Remover TCP/storage complexo**

### **Fase 3: Blockchain Network**

1. **P2P discovery** com libp2p
2. **Consensus simples** (majority vote)
3. **Public ledger** API

## 📊 **Comparação**

### **Antes (Current)**

```
- 15+ arquivos de abstração
- 3 protocolos de comunicação
- State machines for simple logic
- Custom blockchain implementation
- Over-engineered storage
```

### **Depois (Simplified)**

```
- 5-7 arquivos core
- 2 protocolos (HTTP + MQTT)
- Direct logic flow
- Industry standard libs
- Simple storage
```

## ✅ **Benefícios**

1. **📉 Redução de complexidade**: 60% menos código
2. **🐛 Menos bugs**: Menos abstrações = menos pontos de falha
3. **🔧 Manutenibilidade**: Código mais direto e compreensível
4. **📚 Padrões da indústria**: Libs estabelecidas e documentadas
5. **🚀 Performance**: Menos overhead de abstrações
6. **👥 Onboarding**: Mais fácil para novos desenvolvedores

## 🎯 **Conclusão**

Esta refatoração elimina:

- ❌ Over-engineering desnecessário
- ❌ Abstrações que não agregam valor
- ❌ Complexidade cognitiva
- ❌ Protocolos redundantes

E implementa:

- ✅ Padrões da indústria
- ✅ Código direto e simples
- ✅ Libs estabelecidas
- ✅ Arquitetura clara

**Recomendação**: Proceder com refatoração completa para entregar um sistema profissional e maintível.
