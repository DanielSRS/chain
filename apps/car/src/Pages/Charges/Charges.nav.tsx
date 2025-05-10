import React from 'react';
import { Charges } from './Charges.js';
import { useNavigation } from '../../../../shared/index.js';

export function ChargesPage() {
  const navigation = useNavigation();
  return (
    <Charges
      onSelectCharge={charge => {
        navigation.navigate('chargeItem', charge);
      }}
    />
  );
}
