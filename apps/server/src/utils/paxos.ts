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
  /** @xstate-layout N4IgpgJg5mDOIC5QAcCGAPA9rAtAW1QGMALASwDswA6AGTFQCdKGrSIAbMAYgGEB5AHIBlAKLCAqkIDaABgC6iFNlIAXUpnKKQ6RDgBMAVgCcANioAOAOwBmS+aN7rexyYMAaEAE9dAFksyqE3MTOwBGaxlLIKCAXxiPNCxcAhIKajpGZlYObgBBHh4RAAUAFREAEVkFJBBkZTUNLR0EHAiDM1CfEwcTR1MjIw9vFp9zAJ9rELGDcx9jUKNrOISMbHwiMkoqXMJCMGQVTAYuACURURKqrTrYVXVNGuacHx8jUKpQyxnnB2tBr10BgM1ioRmBoRk5mstl6dmWtVWyQ2aW2u32hxYRROfAAsgBJURcK41G53RqPXTWPzmD4GQy9HwyAyWCZDSlgqh6IzmLnWAwvMaheGJNYpTbUHZ7A5HbYFYplcpcCAaagUABumAA1tQRUjUltJeiZflCqUKgh1ZhCKgGuQqsSlLdbU1fJZTLSZD49KFzMCxuY2S09D53qFQq4ZHyTAs9PZhYj1vqJWjpSwTfKKlwwAwGDLkOwbQAzI54Ki6xPi1FSjGy00Ki3kDXW232+TXer3F0tAwyXpUSZ6SwQzrmWZAwM4To+KiQhx04OWIf+SzxpIVlGG1PZThcdOlB21Dvk0BPOZMmc9r6ennhPkT4xUfwyGRGFl80YGVei5EGlM1tg7nulyhNUjpkg8J6+NGRicmGz4+n4nqhBOVIwdC1KhDMJhBMYn7xAia5ihuf4ygB3BYsUuRnAepLOhSIydJYVAzBMIQLoyPgTnonozgMuHYX8Jh8ks+HlkRv7VqRORcBRRRUSIUgge2TqdvRzyYQYVB+AMsbcT6TgoQ+kLUpCQnzEKokJuJOq5jcYDrlsZFcEIJRUSUAD6WJ8EUfBCHiAgAOI0UeEHaICDg0hMExLm0Q4Tq8ZhdL0pkQm0ehfnqlbILZ2D2dZ2wAOq5CU-kBZ52L4oSXmVQpbYkiFXY4MYDgWJ8oSGHpwRcbMWmLjyMImL2nQZQ5NmYHZo2FcVpXlbiBIiFw6CwCoNrUKghYqNmAAUPYyAAlFwYk-mNE35bkRUlYFs01cFKnHmF3bYTBl7Qr6LLjgCLR8gEUL2IsQJUnYK6WYRx1ljlsB5WDQG7nKZqVHVYF0ZB3ZGBMgSzE4MztU41gTjSBifIOfKzBCoyxiN+XZeNuWTTDS0rZtVDrZtDA7c+B1HUm4M05DdNw5ciOHndoVPL07RaRE-qWNxNgTu104DF0UuRoOMsiSsoPc9Tp1g-wwhiEIkhEkLtGqSjTW6aC7VjFSwI2P8wyYWYMhhkCVjcoNtg+JTYM67T+UlXgkDuZgACuKgm6BwvgY1-K2I+AzPs4mERI7UEwWrehBJ6wLRnhmvftzGRMNmVBeYUQhCO5Qi4iIJQABKlVHymx2pziu4EDhus+i5CXjn1NRLkbYb0nQ-O1cT4eQmAQHA1xWcdrfIw9OBmXokuQpCMuRAPww4DY7wj0OUvdJhwOF5lKIl8wy-m6v1hkx8XQ9H03Tpy0Jjo3nQRRJ0XsFwIkXSsN8y5kTvvdJ4XIITP26JCTo3Js56HvD2UEr0wyjkXH4H2INgHX3oKXTE2JK7V1rjieuTdAoQNFrobOMC5gLBHFSZw7hB6PxpJMKEzJ-AuFdr7bmm4MTULjnBfssJhyjDHKw-eX93hzDTl-Z8OkLKXzpiRIhc1RDCLUpMN0HwmTdAjK8Ywe9aGLl4lSRiX8uiuxwaos66jawZnKNoi2LxCagkJrYSEQIHCGEDA+OwkY3iEzpDLYM-DKyCKkpwVxq8oqaU+DMKwfJ+TBmkb4XsgQuSRE6ITcMLhIkon9nzaycSxYRGnBMLeVhZamM-ujZwY5Oh-FjKOIpWwSlQ25uA+qIs46zDMOYcM-RmRCUHCgzSMtZjcVHGjXJHSToB2hhdGa1V5rlPCjxF8TJjAsjRgsQyG9oRGFdsGX04zmSLJ5rrARAtNmo2CDOK8nxIhAldvLfk-YFjwOMM4LoKigFX06RDbplZ9aiAkEIB5TUdKPmCC+Ic7Qvgf3ahvF8jJ2jBGzjINW1yumTSDiHcOKgYVAnCDORwNtfQsJQiyZi9glGRBTsCEScQgA */
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

          always: 'idle',
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
