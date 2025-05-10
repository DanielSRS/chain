import React from 'react';
import { useNavigation } from '../../../../shared/index.js';
import { ChargeInfo } from './charge-info.js';
import { Text } from 'ink';
import type { Charge } from '../../../../shared/src/utils/main.types.js';

export function chargeInfoPage() {
  const navigation = useNavigation();
  const charge = navigation.state.routes[navigation.state.index]?.params;

  if (!charge) {
    return <Text>Invalid params??</Text>;
  }

  return <ChargeInfo charge={charge as Charge} onGoBack={navigation.goBack} />;
}
