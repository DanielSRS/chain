import { assign, createMachine } from 'xstate';

type Events =
  | { type: 'RETRY' }
  | { type: 'SELECT_DEPARTURE'; data: { departure: string } }
  | { type: 'SELECT_DESTINATION'; data: { destination: string } };

type Services = {
  getCities: { data: { cities: readonly string[] } };
  getAvaliableRoutes: { data: { routes: 'fsn' } };
};

type Context = {
  departure: string;
  destination: string;
  cities: readonly string[];
  getCitiesError: unknown;
  routes: unknown;
  routesError: unknown;
};

export const TravelMachine = createMachine(
  {
    /** @xstate-layout N4IgpgJg5mDOIC5QBcBOBDAbmANgBXRgFl0BjACwEsA7MAOgBkB7dCGqAYUuUrgGIITWnRqYmAa3posuAsTJVhzVuy484CUU1LoeQgNoAGALpHjiUAAcmsbpSEWQAD0QBaAIwB2ABwBWOgCcAEwALL4Bhu5BhoYAbL6eADQgAJ5uQQDMAXSx7gGeGbEhuSFBvu4AvhXJ0tj4hGAkFDT0ymzUnHb8YKioTKh0lji6AGb9ALZ0tbINTYqtLO2d6rCa1GI6etRmZo7WtluOLggeIQH+hedRMYUZ3slpJ5nZufmFxe6l5VU1GHVyjQULToal4sDakDoABEwJZ0KhkABXVD0ACq1FguDApGQkBhcIRyLAfAAygBRBhkjgAFQA+lCyXgAIIAJWpqJZZN2SBA+zsDh5xw8njydEMvjioVi8Qyvl8sQeiHi-niYSivgynwC7m8PxA03q8mawlBcAhEGhsPhSJRloJNrAJKxOMgpIpVLpDOZbI5XJMexs-OoRzcXkyOUKCViETOXgyioQATudG8nkipU8sUyWYCeoNALmwNN4MWkJhsB41F09modHRmJw2NxEHLlerQjdlJp9LJJOpAEkAHJMgcAeUH3KsgcOgtD7gyhjocpCnlK+UMQU88oTsQyQTopRXcuiGU8q6Ceb+MyN8xBXRLrDLcDbWzrGOdzdbNHb1E7Hp7fZDiO-bjvo7jmDyfIzqAQoJP4QSxHE4QhKU3hFEEO57geoRnrkhjeNqsSXjIhqAsa9DFualoVt+r5flWWxOo2LoQH+3Zeqy7KcpOvLTjWIYnO4MT7uUkSIbusSeGU9ypIgSaxGKATShKe5ZIRxH-LMQImveVH0T+1EvjWTFNq65Jdp6jKcb6YEQVOBz8bOJzytkhhKS5e4BAE3iRAmARhEuWQZKeQTamcGQadeZG3pRpYWvpdHPrRxkfmZ7rsb2A7DmOE7+pBfECjBobip4KZeSEG7au44Qbgm7hRPu6ZbvhPgIRukWkYWOkrHpSUMTWhnJUIJksWxlmAdlIETuBAYOYVzhuHBdBtVmXxKauIR1Q1YqfM1qbeG1ngdQW2kUbpcV0CyTCIrisB0IOTDIDCIwtKx5n-hxPrcXl9lBgJCQiYYC6bgh3hCXEO7hHQabeXcQRBN4IRgyEx1aeRd49RdV03XA92Pc9r1jQBWXAaBP28XNwZOUJp5itGhRBNVGQVUDkPZDD3hwwjSOfKjN5Fudj4Wtjt2Wi9tAQNSV44AIQj0FokhTNLJ3o7FQuXddosExLUskWsGw-js5NQY5RUIMq2GfPOqa4RDskIEJAXI94YPzrEaFKXz0UC5j6si7j2uQLrdR8D0fQDEMowTErJEqzFgsQJC-t3YHkvS-r2iGyYPEm-Nxw0+4dB5KEvghLKCQxAq9uO-4zuu4UHtEdU+rK2j8e+4nwua7jyfmkTn1cX6dkU391MxNDEqpghom5JkCZTwehQFEmQUI03vyx23PtglRycazjD6d-3VlfVyM35ZTAlCYXW4rguxQimvm322cCnu1Ep631cubN-mW-dTvLG3c7q9zisfCapNcrD1zlTM2jslxoQOpkNMblPgyUeEpbwgR5SeH8pkcI4QvZdTOh3JOwD963T7u9DKECcq2VmqPM25wlwRGUpzVBERfAJl8IjZaoR6oHSUmXLwRDToY0AX7choDWAADF0CUBlk4Csuh6DoBGLiVAAAKBcMQACUfA-78wAWaIBB8KEmNkfInAOcCqwIWg7UK+5MxnDQmmM8Zc-KRAjMUF2Ukqr1VEejAA4mAZAxY5EKNdJyakLIACaNjL5OVcEpRqiMUK4NYX4AICZXAZiXNEHyJdQjijQoE28ISwn3giY2ViSjkAqLoGojR2iYiGH0YY72wgKnhKsZABJjD7G5KhsEaI1VrYlLlDkpGtd4hZiiGcM8vgqjN2oEwRO8AeQdOIQw6CgydSSQjPETMMZtQFBycpIuhgKrSgqgRYKupf6tyMQsFQHRiw7NNns92GQ6YoX2ZkUo+EploUuRVaIK8WplO3hYzuHy86hjBi8SMxyrmnPjPbaeB4kaIQ1IYEUVUUaPM3s88RMKnz2iJHCuxQovAikOVGE5cYEwhB1BPYKCEEYI0zJkKFxjD7kutESN8DZTItitISFEVKBLClZftHwZcvIinnNwuIy0NTM2jPkXwm4llEs0iStWnc7SCttPiE1jpUoQClUkrwbklw8JXGeKeCQkj2x8lg8ojNAXBAOpJXlJCJFGoSp8mB0r6o+HtSuNcaYdVV0eNcugn83IygKCuC8eqorENJfy+KfUDL1ktcG+aoabUbh+TEHwRQjnBS8MypMKYzzhrKHkbyK5-XZt6jRfqQhBrduoCNZs1qzYeDiApE81UEhRrLnGxAmYfmaskjqfCXh5TtsNWQg+Q77ErhYaOnhC5tScITFkUqKE0Lzk1FkLJa6E4btFg9J6YBxaQC3ccLMCkJSrjiEmBI5wZ0ICRiEQI0zzg+W+ZEG9pCu5mNTsHXAr6lRIzFC4q4CQL1cLdcFIuri8XBUVVmSDga7092AeaBD5t606k3NVVciFQjoseFEec0MtzBSBlJFCEUM2dTEeu6DotpEQGqeRoScpfm7ncHMnCdVGY-MWWxkKnH23dKqb0q1F8Bk0qjQg5dnN3Zl2Cjkhcy04wbh1AuD2pTllAA */
    id: 'travelPageMachine',
    predictableActionArguments: true,

    tsTypes: {} as import('./travel.machine.typegen.d.ts').Typegen0,
    schema: {} as {
      events: Events;
      services: Services;
      context: Context;
    },

    description: `Define o comportamento da pagina de viagens.

Controla a exibição das informações, bem como a troca de dados com a api`,

    states: {
      LoadingCities: {
        description: `Buscando na api as cidades disponíveis para viajar`,

        invoke: {
          src: 'getCities',

          onDone: {
            target: 'CitiesLoaded',
            description: `Dados recuperados com sucesso.`,
            actions: 'saveCitiesToContext',
          },

          onError: {
            target: 'GetCitiesFailed',
            description: `Houve erro na comunicação com a api`,
            actions: 'saveGetCitiesErrorToContext',
          },
        },
      },

      CitiesLoaded: {
        description: `Informações sobre as cidades dispinível`,
        type: 'parallel',

        states: {
          Departure: {
            states: {
              UnselectedDeparture: {
                on: {
                  SELECT_DEPARTURE: {
                    target: 'DepartureSelected',
                    actions: 'saveDepartureToContext',
                  },
                },
              },

              DepartureSelected: {
                on: {
                  SELECT_DEPARTURE: {
                    target: 'DepartureSelected',
                    internal: true,
                    actions: 'saveDepartureToContext',
                  },
                },
              },
            },

            initial: 'UnselectedDeparture',
          },

          Destination: {
            states: {
              UnselectedDestination: {
                on: {
                  SELECT_DESTINATION: [
                    {
                      target: 'DestinationSelected',
                      cond: 'isNotTheSameAsDeperture',
                    },
                    {
                      target: 'UnselectedDestination',
                      internal: true,
                    },
                  ],
                },
              },

              DestinationSelected: {
                on: {
                  SELECT_DEPARTURE: [
                    {
                      target: 'DestinationSelected',
                      internal: true,
                      description: `Sempre que mudar a origem, verifica se é diferente do destino`,
                      cond: 'isNotTheSameAsDeperture',
                    },
                    'UnselectedDestination',
                  ],

                  SELECT_DESTINATION: [
                    {
                      target: 'DestinationSelected',
                      internal: true,
                      cond: 'isNotTheSameAsDeperture',
                    },
                    'UnselectedDestination',
                  ],
                },

                entry: 'saveDestinationToContext',
              },
            },

            initial: 'UnselectedDestination',
          },

          Routes: {
            states: {
              NotDefined: {
                description: `Origem e destinos ainda não definidos`,

                on: {
                  SELECT_DEPARTURE: {
                    target: 'DefinedTravel',
                    cond: 'ifBothDefinedAndDifferent',
                  },

                  SELECT_DESTINATION: {
                    target: 'DefinedTravel',
                    cond: 'ifBothDefinedAndDifferent',
                  },
                },
              },

              DefinedTravel: {
                description: `Origem e destinos definidos`,

                invoke: {
                  src: 'getAvaliableRoutes',
                  onDone: {
                    target: 'RoutesLoaded',
                    actions: 'saveRoutesToContext',
                  },
                  onError: {
                    target: 'RoutesLoadFail',
                    actions: 'saveRoutesErrorToContext',
                  },
                },
              },

              RoutesLoaded: {
                on: {
                  SELECT_DEPARTURE: [
                    {
                      target: 'DefinedTravel',
                      cond: 'ifBothDefinedAndDifferent',
                    },
                    'NotDefined',
                  ],

                  SELECT_DESTINATION: [
                    {
                      target: 'DefinedTravel',
                      cond: 'ifBothDefinedAndDifferent',
                    },
                    'NotDefined',
                  ],
                },
              },
              RoutesLoadFail: {
                after: {
                  '3000': 'DefinedTravel',
                },
              },
            },

            initial: 'NotDefined',
          },
        },
      },

      GetCitiesFailed: {
        description: `Houve falha na recuperação das informações sobre as cidades`,

        after: {
          '3000': {
            target: 'LoadingCities',
            description: `Automaticamente tenta novamente após 3 segundos`,
          },
        },

        on: {
          RETRY: {
            target: 'LoadingCities',
            description: `Volta para o estado inicial para tentar novamente recuperar as informações sobre cidades.`,
          },
        },
      },
    },

    initial: 'LoadingCities',
  },
  {
    actions: {
      saveCitiesToContext: assign((_, event) => event.data),
      saveDepartureToContext: assign((_, event) => event.data),
      saveDestinationToContext: assign((_, event) => event.data),
      saveGetCitiesErrorToContext: assign((_, event) => {
        return {
          getCitiesError: event.data,
        };
      }),
      saveRoutesErrorToContext: assign((_, event) => {
        return {
          routesError: event.data,
        };
      }),
      saveRoutesToContext: assign((_, event) => event.data),
    },
    guards: {
      isNotTheSameAsDeperture: context => {
        return (
          context.departure !== context.destination && context.departure !== ''
        );
      },
      ifBothDefinedAndDifferent: context => {
        return (
          context.departure !== '' &&
          context.destination !== '' &&
          context.departure !== context.destination
        );
      },
    },
  },
);
