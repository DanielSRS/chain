# Plano de Implementação - Sistema Blockchain para VEs

## Visão Geral

Este documento detalha o plano para completar a implementação do sistema descentralizado de recarga de veículos elétricos baseado em blockchain, conforme os requisitos do Problema 3.

## Arquitetura Target

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   EMPRESA A     │────▶│   BLOCKCHAIN    │◀────│   EMPRESA B     │
│                 │     │   CONSENSUS     │     │                 │
│  ┌───────────┐  │     │                 │     │  ┌───────────┐  │
│  │   MQTT    │  │     └─────────────────┘     │  │   MQTT    │  │
│  │  BROKER   │  │                             │  │  BROKER   │  │
│  └─────┬─────┘  │                             │  └─────┬─────┘  │
└────────┼────────┘                             └────────┼────────┘
         │                                               │
    ┌────▼────┐                                     ┌────▼────┐
    │ CARROS  │                                     │ CARROS  │
    │ PONTOS  │                                     │ PONTOS  │
    └─────────┘                                     └─────────┘
```

## Fases de Implementação

### FASE 1: Blockchain Inter-Empresas (Crítico)

#### 1.1 Network Discovery & Formation

**Objetivo**: Empresas se descobrem e formam rede de consenso

**Implementação**:

- [ ] Protocolo de descoberta via multicast/broadcast
- [ ] Handshake de empresas com troca de chaves
- [ ] Formação dinâmica do grupo de consenso
- [ ] Persistência da rede conhecida

**Arquivos a modificar**:

- `apps/server/src/machines/startup.machine.ts` - Estender lógica de join
- `apps/server/src/utils/network-discovery.ts` - **NOVO**
- `apps/server/src/data/company-registry.ts` - **NOVO**

#### 1.2 Blockchain Consensus Engine

**Objetivo**: Paxos integrado para todas as transações

**Implementação**:

- [ ] Integrar `paxos.ts` com sistema de transações
- [ ] Wrapper para propostas de transação
- [ ] Queue de transações pendentes
- [ ] Rollback automático em falhas

**Arquivos a modificar**:

- `apps/server/src/utils/paxos.ts` - Integrar com transactions
- `apps/server/src/services/blockchain-engine.ts` - **NOVO**
- `apps/server/src/data/transaction-queue.ts` - **NOVO**

#### 1.3 Distributed Ledger

**Objetivo**: Ledger sincronizado entre todas as empresas

**Implementação**:

- [ ] Usar estruturas de `commit.ts` funcionalmente
- [ ] Sincronização de commits entre empresas
- [ ] Validação de integridade da cadeia
- [ ] Recovery de estado em caso de dessincronia

**Arquivos a modificar**:

- `apps/server/src/data/commit.ts` - Implementar operações
- `apps/server/src/services/ledger-sync.ts` - **NOVO**
- `apps/server/src/utils/chain-validation.ts` - **NOVO**

### FASE 2: MQTT para Pontos de Recarga (Crítico)

#### 2.1 Station MQTT Communication

**Objetivo**: Pontos se comunicam via MQTT com empresas

**Implementação**:

- [ ] Simulador de pontos de recarga como clientes MQTT
- [ ] Protocolo de estado dos pontos (disponível/ocupado/reservado)
- [ ] Heartbeat para monitoramento
- [ ] Update de estado em tempo real

**Arquivos a criar**:

- `apps/station/` - **NOVO APP**
- `apps/station/src/mqtt-client.ts` - **NOVO**
- `apps/station/src/status-manager.ts` - **NOVO**

#### 2.2 Real-time State Management

**Objetivo**: Estados atualizados via MQTT + blockchain

**Implementação**:

- [ ] Estado local (MQTT) + estado global (blockchain)
- [ ] Conflict resolution entre estados
- [ ] Event sourcing para auditoria
- [ ] Cache distribuído para performance

**Arquivos a modificar**:

- `apps/server/src/services/state-manager.ts` - **NOVO**
- `apps/server/src/mqtt-server.ts` - Integrar com blockchain

### FASE 3: Reservas Atômicas Inter-Empresas (Crítico)

#### 3.1 Multi-Company Route Calculation

**Objetivo**: Calcular rotas envolvendo múltiplas empresas

**Implementação**:

- [ ] Algoritmo de rota considerando ownership dos pontos
- [ ] Query distribuída de disponibilidade
- [ ] Otimização de custo/tempo inter-empresas
- [ ] Cache de rotas frequentes

**Arquivos a modificar**:

- `apps/server/src/services/route-planner.ts` - **NOVO**
- `apps/server/src/utils/weighted-graph.ts` - Estender para multi-company

#### 3.2 Atomic Reservation Protocol

**Objetivo**: Reservas all-or-nothing via blockchain

**Implementação**:

- [ ] Two-phase commit para reservas
- [ ] Timeout e rollback automático
- [ ] Priority queuing para conflitos
- [ ] Compensation transactions

**Arquivos a modificar**:

- `apps/server/src/services/reservation-coordinator.ts` - **NOVO**
- `apps/server/src/protocols/two-phase-commit.ts` - **NOVO**

### FASE 4: Liquidação Financeira (Importante)

#### 4.1 Inter-Company Payments

**Objetivo**: Pagamentos entre empresas via blockchain

**Implementação**:

- [ ] Clearing house virtual
- [ ] Netting de pagamentos
- [ ] Settlement periods
- [ ] Dispute resolution

**Arquivos a criar**:

- `apps/server/src/services/payment-clearance.ts` - **NOVO**
- `apps/server/src/models/account-ledger.ts` - **NOVO**

### FASE 5: Auditoria Pública (Importante)

#### 5.1 Public Ledger Interface

**Objetivo**: Interface para visualizar blockchain

**Implementação**:

- [ ] API REST para consulta de transações
- [ ] Web interface para auditoria
- [ ] Export de dados para compliance
- [ ] Analytics e métricas

**Arquivos a criar**:

- `apps/auditor/` - **NOVO APP WEB**
- `apps/server/src/routes/public-ledger.ts` - **NOVO**

## Cronograma Sugerido

### Semana 1: Blockchain Foundation

- [x] Network discovery
- [x] Paxos integration
- [x] Basic ledger sync

### Semana 2: MQTT Stations

- [x] Station simulator
- [x] Real-time state management
- [x] MQTT protocols

### Semana 3: Atomic Reservations

- [x] Route calculation
- [x] Two-phase commit
- [x] Conflict resolution

### Semana 4: Integration & Testing

- [x] End-to-end testing
- [x] Performance optimization
- [x] Documentation
- [x] Public interface

## Teste de Validação

### Cenário de Teste

1. **3 empresas** (A, B, C) online
2. **Cliente da empresa A** solicita viagem que requer:
   - Ponto da empresa A (origem)
   - Ponto da empresa B (meio)
   - Ponto da empresa C (destino)
3. **Validar**:
   - Descoberta automática de empresas
   - Cálculo de rota distribuída
   - Reserva atômica dos 3 pontos
   - Registro no blockchain compartilhado
   - Estados atualizados via MQTT
   - Liquidação financeira entre empresas

### Critérios de Sucesso

- [ ] Consenso alcançado em <2s
- [ ] Falha de 1 empresa não quebra o sistema
- [ ] Auditoria pública mostra todas as transações
- [ ] Estados consistentes em todas as empresas

## Riscos e Mitigações

### Alto Risco

1. **Complexidade do consenso**: Paxos pode ser complexo

   - _Mitigação_: Usar biblioteca pronta ou implementação simplificada

2. **Performance**: Consenso pode ser lento
   - _Mitigação_: Otimizar apenas transações inter-empresas

### Médio Risco

3. **Sincronização**: Estados podem ficar inconsistentes

   - _Mitigação_: Event sourcing + recovery automático

4. **Network partitions**: Empresas podem ficar isoladas
   - _Mitigação_: Timeout e degradação graciosa

## Métricas de Sucesso

### Funcionais

- [ ] 100% das reservas inter-empresas são atômicas
- [ ] Consensus time < 3s para 95% das transações
- [ ] 0 inconsistências de estado detectadas

### Não-Funcionais

- [ ] Sistema funciona com até 10 empresas
- [ ] Tolerância a falha de até 30% das empresas
- [ ] Auditoria completa de 100% das transações

## Conclusão

Este plano foca nos componentes críticos faltantes, priorizando a implementação do blockchain funcional entre empresas. Com essas implementações, o sistema atenderá completamente aos requisitos do Problema 3.
