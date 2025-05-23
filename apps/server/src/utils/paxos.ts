/**
 * Steps:
 *
 * 1. Request connection with another server (node)
 * 2. If the other server do not have any other connection, it will accept the connection
 * by sending a proposal to the requester
 * 3. The requester will accept the proposal and send an accept message to the other server
 */

import { createMachine } from 'xstate';

type Events =
  | { type: 'ACCEPTED' }
  | { type: 'START_PROPOSING' }
  | { type: 'PROMISE' }
  | { type: 'ACCEPT' }
  | { type: 'RESET' }
  | { type: 'PREPARE' }
  | { type: 'CONSENSUS' };

export const paxos = createMachine({
  /** @xstate-layout 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 */
  id: 'paxos-machine',
  predictableActionArguments: true,

  type: 'parallel',

  schema: {} as {
    events: Events;
  },

  states: {
    Learner: {
      states: {
        idle: {
          on: {
            CONSENSUS: {
              target: 'PROCESS_SOMETHING',
              description: `O aprendiz (learner) é notificado que houve consenso sobre um determinado valor`,
            },

            ACCEPTED: {
              target: 'idle',
              internal: true,
              description: `Ao ser notificado do aceite por um Aceitador (aceptor) verifica se houve consenso com os aceites recebidos por outros aceitadores`,
            },
          },
        },

        PROCESS_SOMETHING: {
          description: `Faz algum tipo de processamento sobre um valor decidido`,
          entry: 'sendResetToAcceptor',
        },
      },

      initial: 'idle',
    },

    Acceptor: {
      initial: 'idle',
      states: {
        PROMISE: {
          entry: ['sendPromiseResponse', 'savePromise'],

          description: `Envia a promessa de não aceitar nenhuma requisição com N menor que atual.

Envia o n_atual, valor_atual de uma proposta anterior aceita, caso haja

PROMISE(n, n_a, v_a)

(Salva a promessa (n) para futuras verificações)`,

          always: 'idle',
        },

        ACCEPTED: {
          invoke: {
            src: 'sendAcceptedToProposer',

            onError: {
              target: 'idle',
              description: `Falha de rede. Não foi possivel enviar ACCEPTED como resposta`,
            },

            onDone: {
              target: 'idle',
              description: `ACCEPTED enviado`,
            },
          },

          description: `Se ainda não prometeu um número maior que n;

Aceita a proposta, registrando n e v;`,

          entry: 'savePropose',
        },

        idle: {
          on: {
            ACCEPT: [
              {
                target: 'ACCEPTED',
                cond: 'if_N_is_bigger_than_previous_proposes',
                description: `Recebeu proposta de um proponente`,
              },
              {
                target: 'idle',
                internal: true,
                description: `se n for menor, simplemente ignora`,
              },
            ],

            PREPARE: [
              {
                target: 'PROMISE',
                cond: 'if_N_is_bigger_than_previous_proposes',
                description: `Ao receber um evento de preparação (prepare) de um proponente (proposer) verifica o valor da proposta é maior que qualquer número de proposta previamente prometido`,
              },
              {
                target: 'idle',
                internal: true,
                description: `o valor da proposta é menor que o prometido para alguma proposta anterior`,
              },
            ],
          },
        },
      },

      on: {
        RESET: {
          target: '.idle',
          description: `Indica que houve consenso, logo o processo foi concluído. onde não são mais validos os valores de n e propostas salvos`,
        },
      },
    },

    'propose-machine': {
      states: {
        idle: {
          on: {
            START_PROPOSING: {
              target: 'AWATING_PROMISE',
              description: `Envia propare para os aceptors`,
              actions: 'sendPrepareRequest',
            },
          },
        },

        AWATING_PROMISE: {
          after: {
            '500': 'TImed_out',
          },

          on: {
            PROMISE: {
              target: 'ACCEPT',
              cond: 'ifMajorityPromised',
              description: `A cada promise recebido, verifica se há maioria, do contrário continua aguardando`,
            },
          },
        },

        ACCEPT: {
          description: `3. Proposta (Propose / Accept Request / Phase 2)

Envia a proposta pra todo mundo`,

          on: {
            ACCEPTED: {
              target: 'CONSENSUS',
              description: `Recebeu o aceite de algum Aceptor.

Verifica`,
              cond: 'ifMajority',
            },
          },

          after: {
            '500': {
              target: 'idle',
              description: `Automaticamente desiste se não`,
            },
          },
        },

        CONSENSUS: {
          description: `Dado que houve consenso. Notifica todos os learners.`,
          entry: 'notifyLearners',

          always: 'idle',
        },

        TImed_out: {
          description: `Não teve a maioria em tempo hábil`,

          always: 'idle',
        },
      },

      initial: 'idle',
    },
  },
});
