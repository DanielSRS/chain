import React from 'react';
import { View } from '../View/View.js';
import { Text } from 'ink';
import type { Position } from '../../utils/main.types.js';
import { FLEX1 } from '../../utils/constants.js';

export function PositionCard(props: { position: Position }) {
  const {
    position: { x, y },
  } = props;

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
        <Text>Posição</Text>
      </View>
      <Text>x: {x}</Text>
      <Text>y: {y}</Text>
    </View>
  );
}
