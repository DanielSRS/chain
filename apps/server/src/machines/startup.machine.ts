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
    /** @xstate-layout N4IgpgJg5mDOIC5SwC4EMBOKCuAHAsmgMYAWAlgHZgB0AyulpVAMQDaADALqKi4D2sMijJ8KPEAA9EAWgDsANgBM1AIwAOFYq0AWAJyz2GlQBoQAT0QqArMvlqAzOytqru+-ZuL5AX2+nUmDgExORUdAzCFCysKtxIIPyCwqLiUgjS9rLa1PK67LpqiuyyWSqGsqYWCJq61LpW8tpq2rJeau2y9r7+EXiEpJQ0AFJ8lEwA4hh8eMwQojSUAG58ANY0AVh9IYPUI2NRk9O4CEt8RGjJFByc1+KJQiJi8WnSVk45ap2Kauz26u6VRDaezKawaOxvdraOzdEAbIL9ULDUYUCZTGZgDBTDDUXAAGwuADM+BgALbUeFbAZhPaog7o46nc6Xa63eL3S6pSyyWoaKz2NxFRTaFTWQEIeyNaiS6HNewi1peWGU4LUmgAQQA7mgHlF1bhcFNFmg8cwAJIAOTNABUzeqADIAfVoAE0LQBhNm8AQPFLPGQKezULJZTLfdjaN66cWdIMqXRuTqyePC+RdPxw3qqpHULU6yJQfWGvjG00SAIoGhoQmVjAACjK7CbAEpmCrETs87rCwajSavQkfZz-ekFLJg-zOkoI-y1NHzECRXVDCoeW8QRGnMqsx2wgAlMAAR2wcBQADEdXjIMxy+hK9Rq7W644W22d9t90eT6gL2QrxABw5R4uXSeMrDqFwHElVx6kjKxxS8FRpVKdhFAKfkGjUbdAipHNaDMCgiCYZh1QABT3AB5AA1ABRR18Bo-AACEaL3R0hgoy1AKHYCR2kUV5GDXIXzTLIrCyRQY2hOo9G0b4FEaCNsM2bMdgAdXzJgzxJd1RErCQUGYWgaOtR13Qoi1rRogANa1uKSXjQBeZNlG+RQFMcRQVGhcV+NqWQ1FyXQlCaP52HkZxfAzCg+AgOBxHbD8wDuHi-ScmQ+QnTJJSKSN7DnXytEE75MlyRoE10FQYQzRK1XCQImBShy0skGQIWoBxZBsDQWnkYptHFNwOpsPJtG0X43jsbRlIRJLdhRNEjia30nnS0dvhyZM8uBeMmnghcEEUSVkJFSbOmsN4VBm3CdndDAwAuMBDjwZbhzWjJMhyApYwFeVk32qp+OUNxPigjRfnUaqehw1Swi7Asiz7PFXsc1rRyscD400eQVD+fK9AqA7xNqaFWlQxt5SUa7YZoA9j1PX9-xRlq0m+QS0ybDwvMlX55HkBCXBOsE8g8AL02hlTdxofDCMa9lUtWtHpDaahgTQqxoXEkVinscUfmUDGimxlxhSsampfmwYIGZxXWfqOp41QuwIoTdyAcQH4kMcMDoXlCM03NuaNO7bSMF0ih9JQG2QLkYVqGcLqPEm4LCcBrJg06525xBeQFCi7wgA */
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
