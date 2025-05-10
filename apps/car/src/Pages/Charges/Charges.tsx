import React from 'react';
import { View } from '../../../../shared/index.js';
import { FLEX1 } from '../../constants.js';
import { use$ } from '@legendapp/state/react';
import { getCharges, SharedData } from '../../store/shared-data.js';
import { useInput } from 'ink';
import { ChargesList } from './components/ChargesList.js';
import type { Charge } from '../../../../shared/src/utils/main.types.js';

interface ChargesProps {
  onSelectCharge?: (charge: Charge) => void;
}

export function Charges(props: ChargesProps) {
  const { onSelectCharge } = props;
  const charges = use$(SharedData.charges) ?? [];

  const retrieveCharges = () => {
    getCharges(SharedData.charges.set);
  };

  useInput(input => {
    if (input === 'c') {
      retrieveCharges();
    }
  });
  return (
    <View style={{ ...FLEX1, marginTop: 1 }}>
      <ChargesList
        charges={charges}
        onSelectCharge={s => {
          // Atualiza as sugestões apos voltar da página de reserva
          // Caso o usuário tenha reservado algum posto
          setTimeout(() => {
            retrieveCharges();
          }, 500);
          onSelectCharge?.(s);
        }}
      />
    </View>
  );
}
