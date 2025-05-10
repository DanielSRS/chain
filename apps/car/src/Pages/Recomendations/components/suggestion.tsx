import React from 'react';
import { useEffect } from 'react';
import { useFocus, useInput, Text } from 'ink';
import { use$ } from '@legendapp/state/react';
import { SharedData } from '../../../store/shared-data.js';
import type { Station } from '../../../../../shared/src/utils/main.types.js';
import { View } from '../../../../../shared/index.js';

export const Suggestion = (props: {
  station: Station;
  onPress?: () => void;
  onFocus?: () => void;
  distance: string | number;
}) => {
  const { station, onPress, onFocus, distance } = props;
  const reservedStation = use$(SharedData.reservedStation);
  const userId = use$(SharedData.car.id);
  const positionInReserveList =
    station.reservations.findIndex(id => id === userId) + 1;
  const isThisReserved =
    positionInReserveList > 0 || station.id === reservedStation?.id;
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
        backgroundColor: isThisReserved ? 'greenBright' : undefined,
      }}>
      <Text>Nome: {station.id}</Text>
      <Text>State: {station.state}</Text>
      <Text>
        Queue: {station.reservations.length}
        <Text>{isThisReserved ? ' (your position is: ' : ''}</Text>
        <Text>{isThisReserved ? positionInReserveList + '°)' : ''}</Text>
      </Text>
      <Text>Distancly: {distance}u</Text>
      {/* <Text>Tipo: {station.type}</Text>
			<Text>Preço: {station.price}</Text> */}
    </View>
  );
};
