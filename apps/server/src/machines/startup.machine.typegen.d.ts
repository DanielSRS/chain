// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  '@@xstate/typegen': true;
  internalEvents: {
    '': { type: '' };
    'done.invoke.startupMachine.JoiningGroup:invocation[0]': {
      type: 'done.invoke.startupMachine.JoiningGroup:invocation[0]';
      data: unknown;
      __tip: 'See the XState TS docs to learn how to strongly type this.';
    };
    'error.platform.startupMachine.JoiningGroup:invocation[0]': {
      type: 'error.platform.startupMachine.JoiningGroup:invocation[0]';
      data: unknown;
    };
    'xstate.after(10000)#startupMachine.AwaitingApproval': {
      type: 'xstate.after(10000)#startupMachine.AwaitingApproval';
    };
    'xstate.after(3000)#startupMachine.RequestFailed': {
      type: 'xstate.after(3000)#startupMachine.RequestFailed';
    };
    'xstate.init': { type: 'xstate.init' };
  };
  invokeSrcNameMap: {
    sendJoinRequestToCompanyIp: 'done.invoke.startupMachine.JoiningGroup:invocation[0]';
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    createGroupAndSaveToContext: '';
    logRequestSent: 'done.invoke.startupMachine.JoiningGroup:invocation[0]';
    processApprovalCommit: 'APROVE_MEMBER_JOIN';
    saveContext: 'SET_CONTEXT';
    saveGroupInfoToContext: 'INITIAL_SYNC';
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasAddressOfGroupMember: '';
  };
  eventsCausingServices: {
    sendJoinRequestToCompanyIp:
      | ''
      | 'xstate.after(10000)#startupMachine.AwaitingApproval'
      | 'xstate.after(3000)#startupMachine.RequestFailed';
  };
  matchesStates:
    | 'AwaitingApproval'
    | 'CreateGroup'
    | 'Joined'
    | 'JoiningGroup'
    | 'RequestFailed'
    | 'Starting'
    | 'Syncing'
    | 'WaitingForContext';
  tags: never;
}
