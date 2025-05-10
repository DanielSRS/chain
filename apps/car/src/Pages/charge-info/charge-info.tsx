import React from 'react';
import type { Charge } from '../../../../shared/src/utils/main.types.js';
import { Logger, View } from '../../../../shared/index.js';
import { Text } from 'ink';
import { FLEX1 } from '../../../../shared/src/utils/constants.js';
import SelectInput from 'ink-select-input';
import { apiClient } from '../../../../shared/src/api/client.js';

interface ChargeInfoProps {
  charge: Charge;
  onGoBack?: () => void;
}
export function ChargeInfo(props: ChargeInfoProps) {
  const { charge, onGoBack } = props;

  async function doPay() {
    const res = await apiClient({
      type: 'payment',
      data: {
        chargeId: charge.chargeId,
        hasPaid: true,
        userId: charge.userId,
      },
    });
    if (res.type === 'error') {
      Logger.error('tcp request failed', res);
      return;
    }

    if (!res.data.success) {
      Logger.error('Api respose was an error: ', res.data);
    }

    // pago!!!!!!
    onGoBack?.();
  }

  return (
    <View style={{ ...FLEX1, borderStyle: 'round' }}>
      <View
        style={{
          // borderStyle: 'round',
          backgroundColor: 'black',
          padding: 1,
        }}>
        <Text>Id: {charge.chargeId}</Text>
        <Text>Start: {new Date(charge.startTime).toLocaleString()}</Text>
        <Text>End: {new Date(charge.endTime).toLocaleString()}</Text>
        <Text>Cost: {charge.cost}</Text>
        <Text>Paid: {charge.hasPaid + ''}</Text>
        <Text>Station: {charge.stationId}</Text>
      </View>
      <SelectInput
        items={[
          {
            label: 'Go back',
            value: 'back',
          },
          {
            label: 'Pay bill',
            value: 'pay',
          },
        ]}
        onSelect={item => {
          if (item.value === 'pay') {
            Logger.info('Stopping charging');
            doPay();
          }
          if (item.value === 'back') {
            onGoBack?.();
          }
        }}
      />
      {}
    </View>
  );
}
