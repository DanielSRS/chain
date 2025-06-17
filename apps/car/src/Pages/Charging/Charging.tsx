import React from 'react';
import { Text } from 'ink';
import { use$ } from '@legendapp/state/react';
import { SharedData } from '../../store/shared-data.js';
import { FLEX1 } from '../../constants.js';
import SelectInput from 'ink-select-input';
import { Logger, View } from '../../../../shared/index.js';
import { mqttHelpers } from '../../api/mqtt-helpers.js';

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
    const res = await mqttHelpers.endCharging({
      battery_level: batteryLevel,
      stationId: charge.stationId,
      userId: charge.userId,
    });

    if (res.type === 'success') {
      if ('success' in res.data && res.data.success) {
        SharedData.chargingCar.set(undefined);
      } else {
        Logger.error('endCharging api error: ', res.data);
      }
    } else {
      Logger.error('endCharging MQTT error: ', res.message, res.error);
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
