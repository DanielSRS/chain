import React from 'react';
import { Text } from 'ink';
import { use$ } from '@legendapp/state/react';
import { SharedData } from '../../store/shared-data.js';
import { FLEX1, SERVER_HOST, SERVER_PORT } from '../../constants.js';
import SelectInput from 'ink-select-input';
import { Logger, View } from '../../../../shared/index.js';
import type {
  Charge,
  Request,
  Response,
} from '../../../../shared/src/utils/main.types.js';
import { tcpRequest } from '../../../../shared/index.js';

interface ChargingProps {
  showProgress?: boolean;
}

export function Charging(props: ChargingProps) {
  const {} = props;
  const charge = use$(SharedData.chargingCar);
  const batteryLevel = use$(SharedData.car)?.batteryLevel ?? -1;

  if (!charge) {
    return <View />;
  }

  const endCharging = async () => {
    // Start loading
    const res = await tcpRequest(
      {
        type: 'endCharging',
        data: {
          battery_level: batteryLevel,
          stationId: charge.stationId,
          userId: charge.userId,
        },
      } satisfies Request,
      SERVER_HOST,
      SERVER_PORT,
    );
    if (res.type === 'success') {
      const apiResponse = res.data as Response<Charge>;
      if (apiResponse.success) {
        SharedData.chargingCar.set(undefined);
      } else {
        Logger.error('endCharging api error: ', apiResponse);
      }
    } else {
      Logger.error('endCharging tcp error: ', res.message, res.error);
    }
    // End loading
  };

  return (
    <View style={FLEX1}>
      <Text>Baterry level {batteryLevel}</Text>
      <Text>Inicio em {new Date(charge.startTime).toLocaleString()}</Text>
      <SelectInput
        items={[
          {
            label: 'Stop charging',
            value: 'stop',
          },
        ].filter(v => v !== undefined)}
        onSelect={item => {
          if (item.value === 'stop') {
            Logger.info('Stopping charging');
            endCharging();
          }
        }}
      />
    </View>
  );
}
