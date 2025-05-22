import React from 'react';
import { useEffect } from 'react';
import { useFocus, useInput, Text } from 'ink';
import { View } from '../../../../../shared/index.js';
import { FLEX1 } from '../../../constants.js';

export interface PathResult {
  path: string[];
  cost: number;
}

export const RouteItem = (props: {
  route: PathResult;
  onPress?: () => void;
  onFocus?: () => void;
  index: number;
}) => {
  const { route, onPress, onFocus, index } = props;
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
        flexDirection: 'row',
        // ...FLEX1,
      }}>
      <View
        style={{
          backgroundColor: isFocused ? 'blue' : undefined,
          paddingY: 1,
          paddingLeft: 1,
        }}>
        <Text>{`${index}`.padStart(3, '0')} - </Text>
      </View>
      <View
        style={{
          // borderStyle: 'single',
          // borderColor: 'white',
          backgroundColor: index % 2 === 0 ? 'black' : 'gray',
          paddingY: 1,
          ...FLEX1,
          // marginBottom: 1,
        }}>
        <Text color={isFocused ? 'blue' : undefined}>
          {route.path.join(' -> ')} - {route.cost}U
        </Text>
      </View>
    </View>
  );
};
