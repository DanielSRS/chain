import { createMachine } from 'xstate';

export const startupMachine = createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4EMBOKCuAHAsmgMYAWAlgHZgB0AyulpVAMQDaADALqKi4D2sMijJ8KPEAA9EAWgDMAFgDs1AKwAaEAE9EigJzUATLqOyAHAdkH5BgIynTAXwcbUmHAWLkqdBsIotWG24kEH5BYVFxKQRjZRV2FV1TdnkE2VldeQ1tBFN9AwA2AxV5XQLFFVkbEtknF188QlJKGgApPkomAHEMPjxmCFEaSgA3PgBrGlcsRs8W6nbO-x6+3ARRviI0CIoOTj3xMKERMRDouUVZVUV2KuLsxBrqUwzTG0tLaxtdOpBp9yaXjaHQo3V6-TAGF6GGouAANtsAGZ8DAAW2o-1mzW8i1By3Baw2Wx2ewOISOOyiiBsBRU1EUtKK6i0iAK7FMql0skU33k5i+P2cfwaHmxNAASmAAI7YOAoABiaDIcMgzAkrhQNDQiM1GAAFLJ2EaAJTMTGioHUSUyuWK5WQMm8ATHSJnanyeTUdhMh4IIzsai6GzsGzFS5WWyC+puLGWgCCAHclX4oHHcLheiM0HC1RqtTrIXrg0b2KbzYD5onk0w0xm+Fm4Y7Qs7KW6ENJ7HTbKZEvYg0UbL6VIplCkDOYbgpx0HfuW5t4q8d-LXM9nmABJABy64AKuu4wAZAD6tAAmpuAMJNiknKnt2QFK63UMFVJleQqcdZFkIYP2L12PIGRAXYj6ziKFbeLQmgUEQTDMHGAAK4oAPIAGoAKJHvgGH4AAQhh4pHq0KFbteLa3m2ciPtQhryAUug3CUxQqMyOTVKk1A2AyKjBo+6SPooThChQfAQHA4hzmKhwUa6oDnFyVzdr2eQ0rYvrSAY3penkpgMeOpjyGpKjgTGFrzPQbhMDJ4SUfJMhGDY1DlHYFQaaxqi6Yo1jlMObzFKZMzmTiIJgqsNkuqc9n3qYo49lybk-sUHKsewFRpZ8kaBQC840BeGBgNsYArHgEWttFXIGPSgnGLoaQZGxiDjnShppfE4YCtlsaVkmS6pumq5wmVdmSA5DKctyjW5CoBTPMW3l6NUenyF1wUStKsqoHaKoQMNcmjX6D60bIiSTUO7BVSUBSGR6-JZUKUmWtBsHWeSslRQdmlVM53G2HoBTvIZw6+u8bL0rFX53MkK0PRBuULCCkB7R95xWFcHqVJ+AklCkIN6HSz5WNYRhBtywkOEAA */
  id: 'startupMachine',

  predictableActionArguments: true,
  description: `Coordena a criação de um grupo de empresas ou o ingresso em um grupo existente`,

  states: {
    Starting: {
      always: [
        {
          target: 'JoiningGroup',
          cond: 'hasIpOfAGroupCompany',
        },
        'CreateGroup',
      ],
    },

    JoiningGroup: {
      invoke: {
        src: 'sendJoinRequestToCompanyIp',

        onDone: {
          target: 'AwaitingApproval',
          description: `Solicitação recebida pela empresa membro do grupo`,
        },

        onError: {
          target: 'RequestFailed',
          description: `Falha no envio ou recebimento da solicitação`,
        },
      },

      description: `Envia solicitação para o ip da empresa que faz parte do grupo solicitando ingresso.`,
    },

    CreateGroup: {
      description: `Estado final`,
      type: 'final',
    },

    AwaitingApproval: {
      description: `Aguarda aprovação`,

      after: {
        '10000': {
          target: 'JoiningGroup',
          description: `Timeout da solicitação. Reinicia`,
        },
      },

      on: {
        INITIAL_SYNC: {
          target: 'Syncing',

          description: `Recebe os dados do grupo, que inclui:

- os membros
- todos os eventos (commits) trocados até então`,
        },
      },
    },

    RequestFailed: {
      after: {
        '3000': {
          target: 'JoiningGroup',
          description: `Tenta novamente a cada 3 segundos até conseguir enviar`,
        },
      },
    },

    Syncing: {
      on: {
        APROVE_MEMBER_JOIN: {
          target: 'Joined',
          description: `Ingresso no grupo aprovado pelos outros membros/empresas`,
        },
      },
    },

    Joined: {
      type: 'final',
    },
  },

  initial: 'Starting',
});
