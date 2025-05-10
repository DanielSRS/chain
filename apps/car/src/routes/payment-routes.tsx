import React from 'react';
import { Navigator } from '../../../shared/index.js';
import { ChargesPage } from '../Pages/Charges/Charges.nav.js';
import { chargeInfoPage } from '../Pages/charge-info/charge-info.nav.js';

export function PaymentRoutes() {
  const screens = {
    charges: ChargesPage,
    chargeItem: chargeInfoPage,
  };

  return <Navigator initialRouteName="charges" screens={screens} />;
}
