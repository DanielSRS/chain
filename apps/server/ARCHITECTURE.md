# 🏗️ Arquitetura do Servidor de Recarga de VEs com Blockchain

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Componentes Principais](#componentes-principais)
4. [Fluxo de Dados](#fluxo-de-dados)
5. [Endpoints da API](#endpoints-da-api)
6. [Blockchain e Consenso](#blockchain-e-consenso)
7. [Comunicação MQTT](#comunicação-mqtt)
8. [Estrutura de Arquivos](#estrutura-de-arquivos)
9. [Diagramas](#diagramas)
10. [Configuração e Deploy](#configuração-e-deploy)

---

## 🎯 Visão Geral

O servidor de recarga de veículos elétricos é uma aplicação Node.js moderna construída com:

- **Framework**: [Elysia](https://elysiajs.com/) (TypeScript-first web framework)
- **Runtime**: [Bun](https://bun.sh/) (JavaScript runtime performático)
- **Blockchain**: Ethereum com smart contracts Solidity
- **Consensus**: Substituição do Paxos por blockchain Ethereum
- **Comunicação**: HTTP REST + MQTT + WebSockets
- **Database**: Blockchain como ledger distribuído + cache local

### 🎉 Migração Concluída: Paxos → Blockchain

O sistema foi **migrado com sucesso** de uma arquitetura complexa (Paxos + XState) para uma **solução blockchain padronizada**:

- ❌ **Removido**: Consenso Paxos customizado (~500 linhas)
- ❌ **Removido**: State machines XState complexas
- ❌ **Removido**: Abstrações curry desnecessárias
- ✅ **Adicionado**: Smart contracts Ethereum (~100 linhas)
- ✅ **Adicionado**: Serviços blockchain padronizados
- ✅ **Resultado**: 70% redução de complexidade

---

## 🏗️ Arquitetura do Sistema

### Modelo Multi-Empresa Descentralizado

```mermaid
graph TB
    subgraph "🚗 Clientes (Carros)"
        Car1[Carro A]
        Car2[Carro B]
        Car3[Carro C]
    end

    subgraph "🏢 Empresa A"
        ServerA[Servidor A<br/>:8095]
        StationA1[Posto A1]
        StationA2[Posto A2]
    end

    subgraph "🏢 Empresa B"
        ServerB[Servidor B<br/>:8096]
        StationB1[Posto B1]
        StationB2[Posto B2]
    end

    subgraph "⛓️ Blockchain Network"
        BC[Smart Contract<br/>ChargingConsensus]
        HardhatNode[Hardhat Node<br/>:8545]
    end

    Car1 -.->|MQTT| ServerA
    Car2 -.->|MQTT| ServerA
    Car3 -.->|MQTT| ServerB

    StationA1 -.->|MQTT| ServerA
    StationA2 -.->|MQTT| ServerA
    StationB1 -.->|MQTT| ServerB
    StationB2 -.->|MQTT| ServerB

    ServerA <-->|Ethereum RPC| BC
    ServerB <-->|Ethereum RPC| BC
    BC <--> HardhatNode

    classDef server fill:#e1f5fe
    classDef blockchain fill:#f3e5f5
    classDef client fill:#e8f5e8
    classDef station fill:#fff3e0

    class ServerA,ServerB server
    class BC,HardhatNode blockchain
    class Car1,Car2,Car3 client
    class StationA1,StationA2,StationB1,StationB2 station
```

### Protocolos de Comunicação

1. **Empresa ↔ Clientes**: MQTT (tempo real)
2. **Empresa ↔ Estações**: MQTT (status, comandos)
3. **Empresa ↔ Outras Empresas**: Blockchain Ethereum (consenso)
4. **Clientes/Apps ↔ Empresa**: HTTP REST (API pública)

---

## 🧩 Componentes Principais

### 1. **Servidor Principal** (`blockchain-server.ts`)

```typescript
// Servidor Elysia com integração blockchain
const app = new Elysia()
  .decorate('blockchain', blockchain) // Serviço Ethereum
  .decorate('mqttClient', mqttClient) // Cliente MQTT
  .decorate('companyId', COMPANY_ID) // ID da empresa

  // Endpoints principais
  .get('/', healthCheck)
  .post('/reserve', reserveStation) // Reservar posto
  .post('/start-charging', startCharging) // Iniciar recarga
  .post('/end-charging', endCharging) // Finalizar recarga
  .post('/payment', processPayment); // Processar pagamento
```

### 2. **Serviço Blockchain** (`ethereum-consensus.ts`)

```typescript
export class EthereumConsensus {
  // Conexão com blockchain
  private provider: ethers.providers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  // Métodos principais
  async registerStation(companyId: string): Promise<number>;
  async createReservation(
    stationId: number,
    startTime: number,
    endTime: number,
  ): Promise<number>;
  async startCharging(reservationId: number): Promise<void>;
  async completeCharging(
    reservationId: number,
    chargeAmount: number,
  ): Promise<void>;
  async processPayment(reservationId: number, amount: number): Promise<void>;

  // Eventos em tempo real
  onStationRegistered(callback);
  onReservationCreated(callback);
  onChargingCompleted(callback);
}
```

### 3. **Smart Contract** (`ChargingConsensus.sol`)

```solidity
contract ChargingConsensus {
    // Estruturas de dados
    struct Station { uint256 id; string companyId; bool isAvailable; address owner; }
    struct Reservation { uint256 stationId; address user; uint256 startTime; uint256 endTime; bool isActive; uint256 chargeAmount; bool isPaid; }

    // Funções principais
    function registerCompany(string memory companyId) external
    function registerStation(string memory companyId) external
    function createReservation(uint256 stationId, uint256 startTime, uint256 endTime) external
    function startCharging(uint256 reservationId) external
    function completeCharging(uint256 reservationId, uint256 chargeAmount) external
    function processPayment(uint256 reservationId) external payable

    // Eventos
    event StationRegistered(uint256 indexed stationId, string companyId, address owner)
    event ReservationCreated(uint256 indexed reservationId, uint256 stationId, address user)
    event ChargingStarted(uint256 indexed reservationId)
    event ChargingCompleted(uint256 indexed reservationId, uint256 chargeAmount)
    event PaymentProcessed(uint256 indexed reservationId)
}
```

### 4. **Servidor MQTT** (`mqtt-server.ts`)

```typescript
// Cliente MQTT para comunicação em tempo real
export const mqttClient = new Paho.Client(mqttHost, mqttPort, wsPath, clientId);

// Tópicos suportados
const topics = {
  cities: () => ({ data: CITIES, responseTopic: 'cities/response' }),
  routes: ({ departure, destination }) => ({
    data: ComputedRoutes[departure][destination],
    responseTopic: 'routes/response',
  }),
};
```

---

## 🔄 Fluxo de Dados

### Fluxo de Reserva (Multi-Empresa)

```mermaid
sequenceDiagram
    participant Car as 🚗 Carro
    participant CompanyA as 🏢 Empresa A
    participant Blockchain as ⛓️ Blockchain
    participant CompanyB as 🏢 Empresa B
    participant Station as ⚡ Posto B

    Car->>CompanyA: POST /reserve {stationId: B1, userId: "car123"}
    CompanyA->>CompanyA: Validar dados locais
    CompanyA->>Blockchain: createReservation(B1, startTime, endTime)
    Blockchain->>Blockchain: Validar disponibilidade
    Blockchain->>CompanyB: Event: ReservationCreated
    CompanyB->>Station: MQTT: reserve {stationId: B1}
    Station->>CompanyB: MQTT: status {state: "reserved"}
    Blockchain-->>CompanyA: reservationId: 123
    CompanyA-->>Car: {success: true, reservationId: 123}
```

### Fluxo de Recarga

```mermaid
sequenceDiagram
    participant Car as 🚗 Carro
    participant Company as 🏢 Empresa
    participant Blockchain as ⛓️ Blockchain
    participant Station as ⚡ Posto

    Car->>Company: POST /start-charging {reservationId: 123}
    Company->>Blockchain: startCharging(123)
    Blockchain->>Company: Event: ChargingStarted
    Company->>Station: MQTT: start {reservationId: 123}
    Station->>Station: Iniciar processo de recarga
    Station->>Company: MQTT: charging {progress: 25%}

    Note over Station: Recarga em progresso...

    Station->>Company: MQTT: completed {chargeAmount: 50kWh}
    Company->>Blockchain: completeCharging(123, 50)
    Blockchain->>Company: Event: ChargingCompleted
    Company-->>Car: {status: "completed", amount: 50}
```

---

## 🌐 Endpoints da API

### Endpoints Principais

| Método | Endpoint             | Descrição                    | Parâmetros                      |
| ------ | -------------------- | ---------------------------- | ------------------------------- |
| `GET`  | `/`                  | Health check do servidor     | -                               |
| `GET`  | `/blockchain/status` | Status da conexão blockchain | -                               |
| `POST` | `/reserve`           | Reservar posto de recarga    | `{stationId, userId}`           |
| `POST` | `/start-charging`    | Iniciar sessão de recarga    | `{reservationId, userId}`       |
| `POST` | `/end-charging`      | Finalizar recarga            | `{reservationId, batteryLevel}` |
| `POST` | `/payment`           | Processar pagamento          | `{reservationId, amount}`       |
| `GET`  | `/stations`          | Listar postos disponíveis    | -                               |
| `GET`  | `/suggestions`       | Sugestões de postos próximos | `{location, radius}`            |

### Endpoints de Registro

| Método | Endpoint             | Descrição              | Parâmetros                     |
| ------ | -------------------- | ---------------------- | ------------------------------ |
| `POST` | `/register-station`  | Registrar novo posto   | `{companyId, location}`        |
| `POST` | `/register-user`     | Registrar novo usuário | `{userId, carModel, location}` |
| `GET`  | `/station-info/{id}` | Informações do posto   | `stationId`                    |

### Endpoints Blockchain

| Método | Endpoint                       | Descrição                     | Parâmetros      |
| ------ | ------------------------------ | ----------------------------- | --------------- |
| `POST` | `/blockchain/transaction`      | Submeter transação            | `{type, data}`  |
| `GET`  | `/blockchain/station/{id}`     | Estado do posto no blockchain | `stationId`     |
| `GET`  | `/blockchain/reservation/{id}` | Dados da reserva              | `reservationId` |

---

## ⛓️ Blockchain e Consenso

### Substituição do Paxos

**Antes (Problemático):**

```typescript
// Consenso Paxos customizado - ~500 linhas de código complexo
class PaxosConsensus {
  async propose(value) {
    /* lógica complexa */
  }
  async accept(proposal) {
    /* validação manual */
  }
  async commit(value) {
    /* distribuição manual */
  }
}
```

**Depois (Simplificado):**

```typescript
// Blockchain Ethereum - ~100 linhas de integração
class EthereumConsensus {
  async submitTransaction(tx) {
    const result = await this.contract.createReservation(
      tx.stationId,
      tx.startTime,
      tx.endTime,
    );
    await result.wait(); // Consenso automático via blockchain
    return result;
  }
}
```

### Vantagens da Migração

| Aspecto            | Paxos (Antes)               | Blockchain (Depois)           |
| ------------------ | --------------------------- | ----------------------------- |
| **Complexidade**   | ~500 linhas customizadas    | ~100 linhas padronizadas      |
| **Confiabilidade** | Implementação manual        | Protocolo testado em produção |
| **Auditabilidade** | Logs locais                 | Ledger imutável e público     |
| **Debugging**      | Difícil diagnóstico         | Ferramentas padrão (Hardhat)  |
| **Escalabilidade** | Limitada a nós configurados | Rede Ethereum ilimitada       |
| **Transparência**  | Opaca entre empresas        | Totalmente transparente       |

### Tipos de Transação

```typescript
interface BlockchainTransaction {
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
```

---

## 📡 Comunicação MQTT

### Tópicos e Mensagens

#### Empresa → Clientes (Carros)

```typescript
// Tópico: company/{companyId}/cars/{carId}/response
{
  type: "reservation_confirmed",
  data: {
    reservationId: 123,
    stationId: 5,
    estimatedTime: "15 min"
  }
}
```

#### Empresa → Estações

```typescript
// Tópico: company/{companyId}/stations/{stationId}/commands
{
  type: "reserve_station",
  data: {
    reservationId: 123,
    userId: "car456",
    startTime: 1640995200000
  }
}
```

#### Estações → Empresa

```typescript
// Tópico: company/{companyId}/stations/{stationId}/status
{
  type: "status_update",
  data: {
    state: "charging", // "available" | "reserved" | "charging" | "maintenance"
    currentUser: "car456",
    chargeProgress: 65,
    estimatedCompletion: "10 min"
  }
}
```

### Configuração MQTT

```typescript
const mqttConfig = {
  host: process.env.MQTT_HOST || 'localhost',
  port: parseInt(process.env.MQTT_PORT || '9001'),
  path: process.env.MQTT_PATH || '/',
  clientId: `server-${COMPANY_ID}-${Date.now()}`,
};
```

---

## 📁 Estrutura de Arquivos

```
apps/server/
├── 📄 package.json                    # Dependências e scripts
├── 📄 hardhat.config.cjs               # Configuração Ethereum
├── 📄 blockchain-server.ts             # Servidor principal Elysia
├── 📄 mqtt-server.ts                   # Cliente MQTT
├── 📄 setup-blockchain.sh              # Script de configuração
├── 📄 test-blockchain-system.sh        # Testes do sistema
├── 📄 NO-MOCKS-COMPLETED.md           # Documentação da migração
├── 📄 BLOCKCHAIN-QUICKSTART.md        # Guia rápido
│
├── 🗂️ contracts/                       # Smart contracts Solidity
│   └── 📄 ChargingConsensus.sol        # Contrato principal
│
├── 🗂️ src/
│   ├── 📄 blockchain-server.ts         # Servidor principal com blockchain
│   ├── 📄 mqtt-server.ts               # Servidor MQTT
│   ├── 📄 server.ts                    # Servidor HTTP legado (TCP)
│   │
│   ├── 🗂️ routes/                      # Endpoints da API
│   │   ├── 📄 reserve.ts               # Reservar posto
│   │   ├── 📄 reserve-blockchain.ts    # Reserva via blockchain
│   │   ├── 📄 startCharging.ts         # Iniciar recarga
│   │   ├── 📄 endCharging.ts           # Finalizar recarga
│   │   ├── 📄 payment.ts               # Processar pagamento
│   │   ├── 📄 registerStation.ts       # Registrar posto
│   │   ├── 📄 registerCar.ts           # Registrar carro
│   │   ├── 📄 getStationInfo.ts        # Info do posto
│   │   ├── 📄 stationSuggetions.ts     # Sugestões de postos
│   │   ├── 📄 rechargeList.ts          # Lista de recargas
│   │   ├── 📄 router.ts                # Roteador HTTP
│   │   └── 📄 mqtt-router.ts           # Roteador MQTT
│   │
│   ├── 🗂️ utils/                       # Utilitários
│   │   ├── 📄 ethereum-consensus.ts    # Serviço blockchain principal
│   │   ├── 📄 logger.ts                # Sistema de logs
│   │   ├── 📄 types.ts                 # Tipos TypeScript
│   │   ├── 📄 cities.ts                # Dados das cidades
│   │   ├── 📄 computed-routes.ts       # Rotas pré-calculadas
│   │   └── 📄 curry.ts                 # Funções curry (legado)
│   │
│   ├── 🗂️ data/                        # Dados do sistema
│   │   ├── 📄 data.ts                  # Estados locais (cache)
│   │   └── 📄 commit.ts                # Sistema de commits (legado)
│   │
│   └── 🗂️ schemas/                     # Validação Zod
│       ├── 📄 car.schema.ts            # Schema do carro
│       ├── 📄 user.schema.ts           # Schema do usuário
│       ├── 📄 station.schema.ts        # Schema da estação
│       └── 📄 location.schema.ts       # Schema de localização
│
├── 🗂️ artifacts/                       # Artifacts Hardhat (gerados)
│   └── 🗂️ contracts/
│       └── 🗂️ ChargingConsensus.sol/
│           ├── 📄 ChargingConsensus.json
│           └── 📄 ChargingConsensus.dbg.json
│
└── 🗂️ scripts/                         # Scripts de deploy
    └── 📄 deploy.js                    # Deploy do smart contract
```

---

## 📊 Diagramas

### Diagrama de Componentes

```mermaid
graph TB
    subgraph "🌐 API Layer"
        HTTP[HTTP REST API<br/>Elysia Server]
        MQTT[MQTT Server<br/>Paho Client]
    end

    subgraph "🧠 Business Logic"
        Routes[Route Handlers<br/>reserve, startCharging, etc.]
        Validation[Schema Validation<br/>Zod Schemas]
    end

    subgraph "⛓️ Blockchain Layer"
        Consensus[EthereumConsensus<br/>Service]
        Contract[Smart Contract<br/>ChargingConsensus.sol]
        Provider[Ethereum Provider<br/>ethers.js]
    end

    subgraph "💾 Data Layer"
        LocalCache[Local Cache<br/>STATIONS, USERS, CHARGES]
        Blockchain[Blockchain State<br/>Immutable Ledger]
    end

    subgraph "🔧 Infrastructure"
        Hardhat[Hardhat Network<br/>:8545]
        Logger[Logger Service<br/>react-native-logs]
    end

    HTTP --> Routes
    MQTT --> Routes
    Routes --> Validation
    Validation --> Consensus
    Consensus --> Contract
    Contract --> Provider
    Provider --> Hardhat

    Routes --> LocalCache
    Consensus --> Blockchain

    Routes --> Logger
    Consensus --> Logger

    classDef api fill:#e3f2fd
    classDef business fill:#f3e5f5
    classDef blockchain fill:#e8f5e8
    classDef data fill:#fff3e0
    classDef infra fill:#fce4ec

    class HTTP,MQTT api
    class Routes,Validation business
    class Consensus,Contract,Provider blockchain
    class LocalCache,Blockchain data
    class Hardhat,Logger infra
```

### Diagrama de Estados da Estação

```mermaid
stateDiagram-v2
    [*] --> Available
    Available --> Reserved: createReservation()
    Reserved --> Charging: startCharging()
    Charging --> Available: completeCharging()
    Reserved --> Available: cancelReservation()

    Available: 🟢 Disponível
    Reserved: 🟡 Reservado
    Charging: 🔴 Carregando

    note right of Available
        Station idle, ready for new reservations
    end note

    note right of Reserved
        Station booked, waiting for car arrival
    end note

    note right of Charging
        Station actively charging a vehicle
    end note
```

### Arquitetura de Deployment

```mermaid
graph TB
    subgraph "🖥️ Development Environment"
        Dev1[Company A Server<br/>:8095]
        Dev2[Company B Server<br/>:8096]
        DevBlockchain[Hardhat Network<br/>:8545]
    end

    subgraph "☁️ Production Environment"
        Prod1[Company A Server<br/>Production]
        Prod2[Company B Server<br/>Production]
        ProdBlockchain[Ethereum Mainnet<br/>or Sepolia Testnet]
    end

    subgraph "📱 Client Applications"
        MobileApp[React Native App<br/>Car Interface]
        WebDashboard[Web Dashboard<br/>Company Admin]
        StationSim[Station Simulator<br/>MQTT Devices]
    end

    Dev1 --> DevBlockchain
    Dev2 --> DevBlockchain

    Prod1 --> ProdBlockchain
    Prod2 --> ProdBlockchain

    MobileApp -.->|MQTT + HTTP| Dev1
    WebDashboard -.->|HTTP| Prod1
    StationSim -.->|MQTT| Dev2

    classDef dev fill:#e8f5e8
    classDef prod fill:#ffebee
    classDef client fill:#e3f2fd

    class Dev1,Dev2,DevBlockchain dev
    class Prod1,Prod2,ProdBlockchain prod
    class MobileApp,WebDashboard,StationSim client
```

---

## ⚙️ Configuração e Deploy

### Variáveis de Ambiente

```bash
# Identificação da empresa
COMPANY_ID=company-a                    # ID único da empresa

# Configuração do servidor
SERVER_PORT=3001                       # Porta do servidor HTTP
NODE_ENV=development                    # Ambiente de execução

# Configuração blockchain
ETHEREUM_RPC_URL=http://localhost:8545  # URL do nó Ethereum
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Configuração MQTT
MQTT_HOST=localhost                     # Broker MQTT
MQTT_PORT=9001                         # Porta WebSocket MQTT
MQTT_PATH=/                            # Caminho WebSocket
```

### Scripts de Deploy

```bash
# Desenvolvimento
yarn blockchain:start                   # Inicia rede Hardhat
yarn blockchain:compile                 # Compila smart contracts
yarn dev                              # Inicia servidor de desenvolvimento

# Teste
yarn test                             # Executa testes completos
yarn blockchain:test                  # Testes específicos do blockchain

# Produção
yarn start                            # Inicia servidor de produção
SERVER_PORT=8095 COMPANY_ID=company-a yarn start  # Multi-empresa
```

### Setup Multi-Empresa

```bash
# Terminal 1: Blockchain Network
cd apps/server
npx hardhat node --port 8545

# Terminal 2: Empresa A
SERVER_PORT=8095 COMPANY_ID=company-a bun run src/blockchain-server.ts

# Terminal 3: Empresa B
SERVER_PORT=8096 COMPANY_ID=company-b bun run src/blockchain-server.ts

# Terminal 4: Empresa C
SERVER_PORT=8097 COMPANY_ID=company-c bun run src/blockchain-server.ts
```

### Docker Compose (Opcional)

```yaml
version: '3.8'
services:
  blockchain:
    image: ethereum/client-go:stable
    ports:
      - '8545:8545'

  company-a:
    build: .
    ports:
      - '8095:3000'
    environment:
      - COMPANY_ID=company-a
      - ETHEREUM_RPC_URL=http://blockchain:8545
    depends_on:
      - blockchain

  company-b:
    build: .
    ports:
      - '8096:3000'
    environment:
      - COMPANY_ID=company-b
      - ETHEREUM_RPC_URL=http://blockchain:8545
    depends_on:
      - blockchain

  mqtt-broker:
    image: eclipse-mosquitto:2
    ports:
      - '1883:1883'
      - '9001:9001'
```

---

## 🎯 Considerações Finais

### ✅ Status Atual

- **Blockchain Consensus**: ✅ Operacional
- **Multi-Empresa**: ✅ Funcional
- **API REST**: ✅ Todos endpoints implementados
- **MQTT**: ✅ Comunicação em tempo real
- **Smart Contracts**: ✅ Deployed e testados
- **Migração Paxos**: ✅ Concluída com sucesso

### 🚧 Melhorias Futuras

1. **Performance**: Implementar cache distribuído Redis
2. **Monitoring**: Adicionar métricas Prometheus + Grafana
3. **Security**: Implementar autenticação JWT e rate limiting
4. **Scalability**: Deploy em Kubernetes com auto-scaling
5. **Mobile**: Desenvolver app React Native para motoristas
6. **Analytics**: Dashboard em tempo real para operadores

### 📚 Documentação Relacionada

- [`BLOCKCHAIN-QUICKSTART.md`](./BLOCKCHAIN-QUICKSTART.md) - Guia rápido
- [`NO-MOCKS-COMPLETED.md`](./NO-MOCKS-COMPLETED.md) - Documentação da migração
- [`contracts/ChargingConsensus.sol`](./contracts/ChargingConsensus.sol) - Smart contract
- [`docs/blockchain-migration-complete.md`](../docs/blockchain-migration-complete.md) - Relatório completo

---

_Documentação gerada para o sistema de recarga de VEs com blockchain - v1.0.0_
