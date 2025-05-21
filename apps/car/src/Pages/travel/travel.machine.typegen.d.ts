// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    'done.invoke.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]': {
      type: 'done.invoke.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'done.invoke.travelPageMachine.LoadingCities:invocation[0]': {
      type: 'done.invoke.travelPageMachine.LoadingCities:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]': {
      type: 'error.platform.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]';
      data: unknown;
    };
    'error.platform.travelPageMachine.LoadingCities:invocation[0]': {
      type: 'error.platform.travelPageMachine.LoadingCities:invocation[0]';
      data: unknown;
    };
    'xstate.after(3000)#travelPageMachine.CitiesLoaded.Routes.RoutesLoadFail': {
      type: 'xstate.after(3000)#travelPageMachine.CitiesLoaded.Routes.RoutesLoadFail';
    };
    'xstate.after(3000)#travelPageMachine.GetCitiesFailed': {
      type: 'xstate.after(3000)#travelPageMachine.GetCitiesFailed';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    getAvaliableRoutes: 'done.invoke.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]';
    getCities: 'done.invoke.travelPageMachine.LoadingCities:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: 'getAvaliableRoutes' | 'getCities';
  };
  eventsCausingActions: {
    saveCitiesToContext: 'done.invoke.travelPageMachine.LoadingCities:invocation[0]';
    saveDepartureToContext: 'SELECT_DEPARTURE';
    saveDestinationToContext: 'SELECT_DESTINATION';
    saveGetCitiesErrorToContext: 'error.platform.travelPageMachine.LoadingCities:invocation[0]';
    saveRoutesErrorToContext: 'error.platform.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]';
    saveRoutesToContext: 'done.invoke.travelPageMachine.CitiesLoaded.Routes.DefinedTravel:invocation[0]';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    ifBothDefinedAndDifferent: 'SELECT_DEPARTURE' | 'SELECT_DESTINATION';
    isNotTheSameAsDeperture: 'SELECT_DEPARTURE' | 'SELECT_DESTINATION';
  };
  eventsCausingServices: {
    getAvaliableRoutes:
      | 'SELECT_DEPARTURE'
      | 'SELECT_DESTINATION'
      | 'xstate.after(3000)#travelPageMachine.CitiesLoaded.Routes.RoutesLoadFail';
    getCities:
      | 'RETRY'
      | 'xstate.after(3000)#travelPageMachine.GetCitiesFailed'
      | 'xstate.init';
  };
  matchesStates:
    | 'CitiesLoaded'
    | 'CitiesLoaded.Departure'
    | 'CitiesLoaded.Departure.DepartureSelected'
    | 'CitiesLoaded.Departure.UnselectedDeparture'
    | 'CitiesLoaded.Destination'
    | 'CitiesLoaded.Destination.DestinationSelected'
    | 'CitiesLoaded.Destination.UnselectedDestination'
    | 'CitiesLoaded.Routes'
    | 'CitiesLoaded.Routes.DefinedTravel'
    | 'CitiesLoaded.Routes.NotDefined'
    | 'CitiesLoaded.Routes.RoutesLoadFail'
    | 'CitiesLoaded.Routes.RoutesLoaded'
    | 'GetCitiesFailed'
    | 'LoadingCities'
    | {
        CitiesLoaded?:
          | 'Departure'
          | 'Destination'
          | 'Routes'
          | {
              Departure?: 'DepartureSelected' | 'UnselectedDeparture';
              Destination?: 'DestinationSelected' | 'UnselectedDestination';
              Routes?:
                | 'DefinedTravel'
                | 'NotDefined'
                | 'RoutesLoadFail'
                | 'RoutesLoaded';
            };
      };
  tags: never;
}
