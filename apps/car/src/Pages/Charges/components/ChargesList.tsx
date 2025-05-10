import { useRef } from 'react';
import type { Charge } from '../../../../../shared/src/utils/main.types.js';
import { Text } from 'ink';
import React from 'react';
import {
  scrollToItemPosition,
  ScrollView,
  View,
} from '../../../../../shared/index.js';
import { ChargeItem } from './ChargeItem.js';
import type { ScrollViewRef } from '../../../../../shared/index.js';
import { FLEX1 } from '../../../constants.js';

interface ChargesListProps {
  charges: Charge[];
  onSelectCharge?: (charge: Charge) => void;
}

export function ChargesList(props: ChargesListProps) {
  const { charges, onSelectCharge } = props;
  const scrollRef = useRef<ScrollViewRef>(null);
  if (charges.length === 0) {
    return (
      <View
        style={{ ...FLEX1, justifyContent: 'center', alignItems: 'center' }}>
        <View>
          <Text>No data</Text>
        </View>
        <View
          style={{
            padding: 1,
          }}>
          <Text>Press c to reload</Text>
        </View>
      </View>
    );
  }
  return (
    <ScrollView ref={scrollRef}>
      {charges.map((charge, index) => (
        <ChargeItem
          key={index}
          charge={charge}
          onFocus={() => {
            scrollToItemPosition(8, index, scrollRef.current);
          }}
          onPress={() => {
            onSelectCharge?.(charge);
          }}
        />
      ))}
    </ScrollView>
  );
}
