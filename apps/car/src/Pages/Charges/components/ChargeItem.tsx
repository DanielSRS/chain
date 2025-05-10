import React, { useEffect } from 'react';
import { View } from '../../../../../shared/index.js';
import { Text, useFocus, useInput } from 'ink';
import type { Charge } from '../../../../../shared/src/utils/main.types.js';

export const ChargeItem = (props: {
  charge: Charge;
  onPress?: () => void;
  onFocus?: () => void;
}) => {
  const { charge, onPress, onFocus } = props;
  const { isFocused } = useFocus();

  useEffect(() => {
    if (isFocused) {
      onFocus?.();
    }
  }, [isFocused]);

  useInput((_input, key) => {
    if (key.return && isFocused) {
      onPress?.();
    }
  });

  return (
    <View
      style={{
        borderStyle: 'round',
        borderColor: isFocused ? 'green' : undefined,
      }}>
      <Text>Id: {charge.chargeId}</Text>
      <Text>Start: {new Date(charge.startTime).toLocaleString()}</Text>
      <Text>End: {new Date(charge.endTime).toLocaleString()}</Text>
      <Text>Cost: {charge.cost}</Text>
      <Text>Paid: {charge.hasPaid}</Text>
      <Text>Station: {charge.stationId}</Text>
    </View>
  );
};
