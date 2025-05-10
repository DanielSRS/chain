import React from 'react';
import { View } from '../View/View.js';
import { Text } from 'ink';
import { FLEX1 } from '../../utils/constants.js';

export function BatteryCard(props: { batteryLevel: number }) {
  const { batteryLevel } = props;

  return (
    <View
      style={{
        padding: 1,
        paddingLeft: 2,
        paddingRight: 2,
        borderStyle: 'round',
        ...FLEX1,
      }}>
      <View style={{ marginTop: -1, paddingBottom: 1 }}>
        <Text>Battery Level</Text>
      </View>
      <Text>{batteryLevel}%</Text>
    </View>
  );
}
