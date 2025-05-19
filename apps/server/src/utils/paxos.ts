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
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAPA9rAtAW1QGMALASwDswA6ZAJ02WzHyLMqtIgBswBiAZQAqAQQBKggPoAFUQHkps-gEkAcgHEA2gAYAuohTZSAF1KZy+kOkQ4ArAE4AjAHYqTtwDYtAZgAsbgBx2ADQgAJ7WAEzeVN4OEe7+To4+ETbuAL7pIWhYuAQkFNR0DEwsBezCAMKVAKJSgrxVtfU1ACLaekggjLDGpuZdVgi2dl42rhFO7gkO7hH+YyHhCA5aUVQJEan+Dv4+znY2mdkY2GVsRfQ9zPkXVE11DQ8t7Q6dBr0mZhZDtjZO4y8SR8NhsPk8aS8S0QgXcrncSS8-niWn8aScx26pzyrEKNCupVueOeDXQsCMqCM1FQADMqbQABQ2LRaACUvByZyJ7GK13OxOqjw6Fh6fW+g2sczscM8k3cdjW9hS0IQXgcDio0q0hwBXm1SKOWSxuX5PIJsBuuPYlVkKn4NTtAFV+LxhV1RV8BqBfjZVj4qPNpvE0vKHMEwog-HZXA59l5PPGfD5fIaTibuZcShbTdRhAB1YSCVRqaRyACySntvBksgr9o0bxFhk9P2soIiXioznVYP8aNSThVsejY3cXjVqzmC0xnJx5UzfIz9wLRfUpdrlZqvDJFKpVFp9KZLPZs5z+Kzlvny8LxfXdZqbo+Yq9ljbIP9Y32Tnj7lj4JVOAuEkY52E4exOEm472DO2JnryhJWtQRZ4JAEiYAArkYrq6E2nz9K2wxguOVB9mC6p2CCvrhssOARH4JHuPsHbJloCIODB6aIeei5cfmN5rjW97VuWm6Pt0zb4RKhGgf6v7flEsZqqxQ7ylQSLzCyPhrD4-gJBxXJcQAMmAqC0JQtAcNwfA2naDr8M6YkepJ3ptloVBpDYESjE42p9v+EbDHCiRaCk7g2Ds8opCF+lzncxmmeZlk8I0govI5Enii5hHhQGYVaOqSbauFNgAbMGxRKFaQ+KMYWpsaBlXvFZlgBZnDJSSbQNu84l4Zlr7DA4eqdikCxJPMkx2I4pWxl2rGbOO8qyl4MVnsIhCEGAyBGJgrVWcJdRiA+OHuhlL6-L44IxHlawOOFY7-EO9gBms3hAqC6qJBEK1LmtG1bTtSV8DIB2iA+jYnb1Z2RLd0YURBbigtqvkAf4JGDU4cTaqGv5jt9vHrZt227e1qWCOlkMETg6lBVoThbFonn-B27gqvGERUO+uleKk47eIxeNXr9hMA4Jm7Yd1Tl9b8sw+Wp-z5bs6q-rpKrzP6aR9vE1Vgox7FGqeP0E-9xN8CSXW4c+lNeIcGoLAzdPVR23ilb6HMAqk3gadM-P67Bht-UT9yk20vAQGY1AUAAbpgADWRR+-jAcAx1rQIFHmCEJS-QdOTltSTgLEuJjTN0-K4UqmO7mJEijGMUmg3+ALdxC8bQfNIIIctfQFnIFwlI0jteA0AngtG4HKdp+Q0eZ56OfHU+Lb534T2hs4YEhWB-gV25CzSmkc3gh5TfEmPO28KD9pk-PPV51lVP+Gsbueai4Wxrdg4BbY+yahjKRhuFoEIh6yNOQTAEA4AihHhcC2i874gXZrKKYCpUgUQiABX+P834hhCvYPWaYGpxRMs1WgMDnL9RwINV2I0gR2HGkkKan9rb+hBM4Tyg1pggkOMfCop8SEQ1vuQnStMNiODXg-PwfYAJTjdopbmuwOF4PqrFPE8FswZlIVLSUF0NhrCQYqVBAFrZwhZHvfKdFHYM24QuBCV42pgA0VDQiCw4SzG8IERwtNZiGO1O5LGUwH6MwolY7iNjm4rlvKLe0DjKb2FYpqBU0wbC+DWGOVWqMETgl8KMbJ0FfacSvKoy8zdSbRPzvYAEHNdhAOcDsLYJUArMlRo4TyCo9haS2HYYJhSzw2XtE6fgpS772GRF2LycQPr6jREOeYLga56hBKxKIYwunmiKXiZCqEMJGEGeQ96LggGflBFpXSDhSrVQ2IEOMBwgS6UbnkghJ8k4WUiTUHZvwZluRrsg72WlxxDiSGjUivoBzJljMElu49g6tDedYa2xF8ppFoWiAEgQVQYxcGsZEHYwJ0RZHc-Byj2BNUSnYmFwwkTRj7Kgh+LJBrOG8S4G234baojZsE4lLUqA1lqPwfgEh+C1hqIIAAEsWMlthPABmqgzIBLSdKs0mFdb8TNEjoy+vcwluZeGA3FfGNIT84hAgmm4Qx8Q1KDUmgmTw4zMiZCAA */
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
