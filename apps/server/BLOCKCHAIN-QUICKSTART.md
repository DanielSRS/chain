# 🚀 Quick Start Guide: Blockchain-Enabled EV Charging System

This guide will help you quickly start the simplified blockchain-enabled EV charging system.

## 🎯 What Changed

✅ **Removed**: Custom Paxos consensus + XState complexity  
✅ **Added**: Ethereum blockchain consensus with smart contracts  
✅ **Simplified**: Startup process and business logic

## ⚡ Quick Start (5 minutes)

### 1. **Test the System**

```bash
cd apps/server
yarn test
```

This will automatically:

- Compile smart contracts
- Start blockchain network
- Test server initialization
- Verify blockchain connectivity

### 2. **Start Development Environment**

**Terminal 1 - Start Blockchain:**

```bash
cd apps/server
yarn blockchain:start
```

**Terminal 2 - Start Server:**

```bash
cd apps/server
yarn dev
```

### 3. **Test API Endpoints**

**Basic Health Check:**

```bash
curl http://localhost:3000/
# Expected: "Hello Elysia - Blockchain Enabled!"
```

**Submit Blockchain Event:**

```bash
curl -X POST http://localhost:3000/blockchain-event \
  -H "Content-Type: application/json" \
  -d '{
    "event": {
      "type": "RESERVE_STATION",
      "data": {
        "stationId": 1,
        "userId": "user123",
        "startTime": 1735776000000,
        "endTime": 1735783200000
      }
    }
  }'
```

## 🏢 Multi-Company Setup

Start multiple charging companies:

**Company A:**

```bash
SERVER_PORT=3001 COMPANY_ID=company-a yarn dev
```

**Company B:**

```bash
SERVER_PORT=3002 COMPANY_ID=company-b yarn dev
```

## 📊 Available Scripts

| Script                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `yarn test`               | Run comprehensive system test                 |
| `yarn dev`                | Start development server with blockchain      |
| `yarn dev-old`            | Start old Paxos-based server (for comparison) |
| `yarn blockchain:start`   | Start Hardhat blockchain network              |
| `yarn blockchain:compile` | Compile smart contracts                       |
| `yarn start`              | Start production server                       |

## 🔧 Configuration

### Environment Variables

```bash
# Company identification
COMPANY_ID=company-a

# Server configuration
SERVER_PORT=3001

# MQTT broker (optional)
MQTT_HOST=localhost
MQTT_PORT=9001
```

### Default Values

- **Blockchain Network**: `http://localhost:8545` (Hardhat)
- **Chain ID**: `1337` (Local development)
- **Server Port**: `3000` (configurable)
- **MQTT**: `localhost:9001` (for company communication)

## 🎯 Key Features

### ✅ Blockchain Consensus

- Smart contract-based reservations
- Transparent transaction history
- Decentralized company consensus
- Real-time event notifications

### ✅ Simplified Architecture

- No complex state machines
- Standard Ethereum tooling
- Clean separation of concerns
- Industry-standard patterns

### ✅ Backward Compatibility

- Same HTTP API endpoints
- Same MQTT communication
- Same data structures
- Seamless migration path

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Kill existing processes
pkill -f hardhat
pkill -f main-blockchain

# Or use different ports
SERVER_PORT=3001 yarn dev
```

### Blockchain Not Responding

```bash
# Restart blockchain network
yarn blockchain:start

# Check if running
curl -s http://localhost:8545 -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"net_version","params":[],"id":1}'
```

### Contract Compilation Issues

```bash
# Clean and recompile
rm -rf artifacts cache
yarn blockchain:compile
```

## 📚 Documentation

- **Full Migration Guide**: `docs/blockchain-migration-complete.md`
- **Smart Contract**: `contracts/ChargingConsensus.sol`
- **Blockchain Service**: `src/utils/ethereum-consensus.ts`
- **Original Analysis**: `docs/migracao-paxos-blockchain.md`

## 🎉 Success Indicators

When everything is working correctly, you should see:

```
✅ Blockchain consensus system initialized
✅ Company company-a registered on blockchain
✅ Station 1 registered on blockchain with ID: 1
🚀 Server initialized for company-a at 192.168.1.9:3001
📊 MQTT client status: Connected
```

## 🔄 Migration Comparison

| Before                       | After                                |
| ---------------------------- | ------------------------------------ |
| Custom Paxos + XState        | Ethereum Smart Contracts             |
| ~500 lines of consensus code | ~100 lines of blockchain integration |
| Complex state transitions    | Simple async/await functions         |
| TCP + MQTT duplication       | MQTT + HTTP + Blockchain             |
| Hard to debug                | Standard blockchain tools            |

---

**🎯 The system is now ready for development with industry-standard blockchain consensus!**
