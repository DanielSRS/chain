import React, { useState } from 'react';
import { Text } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import { isTcpError, View } from '../../../../shared/index.js';
import Spinner from 'ink-spinner';
import { hasMouseEventEmitedRecently } from '../../../../shared/src/utils/mouse-events.js';
import { FLEX1 } from '../../constants.js';
import { apiClient } from '../../../../shared/src/api/client.js';
import type { User } from '../../../../shared/src/utils/main.types.js';

// const log = Logger.extend('RegisterUser');

export function RegisterUser(props: { onUserCreated: (user: User) => void }) {
  const { onUserCreated } = props;
  const [id, setId] = useState<number>();
  const [idField, setIdFiled] = useState('');
  const [tcpErrorMsg, settcpErrorMsg] = useState<string>();
  const [creatingUser, setCreatingUser] = useState(false);

  const createUser = async () => {
    if (id === undefined || typeof id !== 'number') {
      return;
    }
    // Start loading
    setCreatingUser(true);
    const response = await apiClient({
      type: 'registerUser',
      data: {
        id: id,
      },
    });
    setCreatingUser(false);

    // TCP connection error
    if (isTcpError(response)) {
      settcpErrorMsg(response.message);
      return;
    }

    if (!response.data.success) {
      settcpErrorMsg(response.data.message);
      return;
    }

    // Usuário já criado
    onUserCreated(response.data.data);

    // End loading
  };

  /**
   * Show loading indicator while creating user
   */
  if (creatingUser) {
    return (
      // Fill entire screen and center elements
      <View
        style={{ ...FLEX1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Box with green border */}
        <View
          style={{
            padding: 2,
            borderStyle: 'round',
            borderColor: 'green',
            flexDirection: 'row',
            gap: 2,
          }}>
          {/* Description text with a loading indicator */}
          <Text>Creating user</Text>
          <Spinner type="dots12" />
        </View>
      </View>
    );
  }

  return (
    <View style={FLEX1}>
      <View style={{ backgroundColor: 'red' }}>
        <Text>No registered user!!!</Text>
      </View>

      {/* Id input */}
      {!id ? (
        <View>
          <Text>Input the user id: </Text>
          <TextInput
            value={idField}
            onChange={value => {
              if (hasMouseEventEmitedRecently()) {
                // log.debug('Mouse event detected, ignoring input');
                return;
              }
              setIdFiled(value);
            }}
            placeholder="It needs to be a number"
            onSubmit={value => {
              const parsed = parseInt(value);
              if (Number.isNaN(parsed)) {
                // erro
                return;
              }
              setId(parsed);
            }}
          />
        </View>
      ) : (
        <Text></Text>
      )}
      <Text>{tcpErrorMsg}</Text>

      {/* Create user */}
      {id ? (
        <SelectInput
          items={[
            {
              label: 'Criar usuário com id: ' + id,
              value: 'reserve',
            },
            {
              label: 'Cancelar',
              value: 'cancel',
            },
            tcpErrorMsg
              ? {
                  label: 'Tentar novamente',
                  value: 'retry',
                }
              : undefined,
          ].filter(v => v !== undefined)}
          onSelect={item => {
            if (item.value === 'reserve') {
              createUser();
            }
            if (item.value === 'cancel') {
              setIdFiled('');
              setId(undefined);
            }
          }}
        />
      ) : (
        <Text></Text>
      )}
    </View>
  );
}
