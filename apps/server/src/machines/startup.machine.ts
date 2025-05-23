import { assign, createMachine } from 'xstate';
import {
  createCompanyGroup,
  type Commit,
  type CompanyGroup,
} from '../data/commit.ts';
import type { ExtendedLogger } from '../utils/logger.ts';
import type { City } from '../utils/cities.ts';
import type { StationGroup } from '../utils/types.ts';
import axios from 'axios';

type Events =
  | { type: 'INITIAL_SYNC'; data: { companyGroup: CompanyGroup } }
  | { type: 'SET_CONTEXT'; data: Partial<Context> }
  | {
      type: 'APROVE_MEMBER_JOIN';
      data: { commit: Commit<'APROVE_MEMBER_JOIN'> };
    };

type Context = {
  log: ExtendedLogger;
  companyGroup: CompanyGroup;
  stations: StationGroup;
  groupMemberAddress: string | undefined;
  address: string;
  name: string;
};

export const startupMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5SwC4EMBOKCuAHAsmgMYAWAlgHZgB0AyulpVAMQDaADALqKi4D2sMijJ8KPEAA9EAWgDMs9tQAcAJnbsALOwCc69fNkAaEAE9EARh3VzG2QFY7ANg22A7K9kqVAX2-HUmDgExORUdAzCFCys5txIIPyCwqLiUgjadrLU2p525ip27OZ2KrbGZghKikUa5tqOhXZKjto5vv4ReISklDQAUnyUTADiGHx4zBCiNJQAbnwA1jQBWF0hvdQDQ1Gj47gIc3xEaMkUHJzn4olCImLxaXIe1Hau7LL5duWIdrbKstpKcyeTwaFR1dogFZBbqhfqDCgjMYTMAYMYYai4AA2JwAZnwMABbahQtY9MJbBE7JH7Q7HU7nS7xa6nVIWBrUVwNRwFL4IRzsJTPHKuOoaVSg8F+SGdYJkmgAQQA7mgblF5bhcGNZmhMcwAJIAOT1ABU9fKADIAfVoAE0DQBhRm8AQ3FL3GSyRxZN75Zw6ZwlJQaXmWJSCopB-62czNWQQkmy2HUJUqyJQdWavja3USAIoGhoHH5jAACksegAlMwEzCNinVemNVqdU6Ei6We6ENIw3ZqGClHYAUptOZueZeS9XNRNCpVK9ZKDh+Z4zLa2EAEpgACO2DgKAAYirMZBmLn0PnqIXiyWFOoqzX1hvt7vUIeyMeIK3mbdWQgbBpp25T5TEQFRdGySwPg8UowW0FdAlJJNaBMCgiCYZh5QABXXAB5AA1ABRS18AI-AACECPXS0+hww0v3bH9OzkL1qAUDQWleH4CgcEMfkUcxOTydgvXkL1XHg1ZEw2AB1VMmH3fF7VEfMJBQZhaAI41LXtHCDWNAiAA1jXopJGNAB5Z0UbQVG5VwVFkVx6iDVxeW7cxrCcGwfXY0EPF8KUKD4CA4HEB85SuBi3XMmQciyftBzDEcx1chdHGnDRXAcQEvRHQEJOhR8aHoQImAi0yoskGQCm0PsgXcGybG0VxVF5f5rHY+zQxHLx7HyxCNgpRE9jK107mirtZCUKcBUHBzgIqApBQcdhMpWkFYL6qSwntDAwBOMBdjwEaO3G8saocMCFDyRy1CUXkwMUMVVAXJonHkOxNrXBVlQbDNm0xY6zMqrsVE5IU5t5Ac0sBdRXAykcmmcT7CuoTcdz3N8P0Biq0nstL3uFebvnYFRnnYoMXHFDapTCpCULQqJsbG4HpE66hHAEsFHI5yaNBeENPUUZq7MjfIqg0ZG5U2eFICZ39Wd+FxMhKUS+ODEC-0c3sfVKUEwJHBzJaTWSGwUjAlIoFSUDlpjb3ZuzYKanIim0VzRVq9RuRszwBTBfzvCAA */
    id: 'startupMachine',

    tsTypes: {} as import('./startup.machine.typegen.d.ts').Typegen0,
    schema: {
      events: {} as Events,
      context: {} as Context,
    },
    context: {} as Context,

    predictableActionArguments: true,
    description: `Coordena a criação de um grupo de empresas ou o ingresso em um grupo existente`,

    states: {
      Starting: {
        always: [
          {
            target: 'JoiningGroup',
            cond: 'hasAddressOfGroupMember',
          },
          {
            target: 'CreateGroup',
            actions: 'createGroupAndSaveToContext',
          },
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

            actions: 'saveGroupInfoToContext',
          },
        },

        entry: 'logRequestSent',
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
            actions: 'processApprovalCommit',
          },
        },
      },

      Joined: {
        type: 'final',
      },

      WaitingForContext: {
        on: {
          SET_CONTEXT: {
            target: 'Starting',
            actions: 'saveContext',
          },
        },
      },
    },

    initial: 'WaitingForContext',
  },
  {
    actions: {
      logRequestSent(context, event) {
        context.log.info('Connection request sent: ', event.data);
      },
      saveGroupInfoToContext: assign((_, event) => event.data),
      processApprovalCommit: (context, event) => {
        const { commit } = event.data;
        context.log.info('Processing approval commit: ', commit);
        context.companyGroup.commits.commitRegistryById[commit.id] = commit;
        context.companyGroup.commits.commitRegistryByIndex[commit.index] =
          commit;
        context.companyGroup.commits.lastCommitId = commit.id;
        context.companyGroup.commits.lastCommitIndex = commit.index;
        context.companyGroup.members.push(commit.data.company);
        const stationByCity = context.companyGroup.stations;
        Object.values(commit.data.stations).forEach(s => {
          const city = s.city as City;
          stationByCity[city].push(s);
        });
      },
      createGroupAndSaveToContext: assign(context => {
        const newGroup = createCompanyGroup(
          context.address,
          context.name,
          context.stations,
        );
        return {
          companyGroup: newGroup,
        };
      }),
      saveContext: assign((_, event) => event.data),
    },
    guards: {
      hasAddressOfGroupMember: context => {
        return !!context.groupMemberAddress;
      },
    },
    services: {
      sendJoinRequestToCompanyIp: async context => {
        const res = await axios
          .post('http://' + context.groupMemberAddress + '/connect', {
            event: {
              type: 'JOIN_GROUP',
              data: {
                company: {
                  address: context.address,
                  id: context.address,
                  name: context.name,
                },
                stations: context.stations,
              } satisfies Commit<'APROVE_MEMBER_JOIN'>['data'],
            },
          })
          .catch(e => {
            context.log.error('Error sending join request: ', e);
            throw e;
          });
        return res;
      },
    },
  },
);
