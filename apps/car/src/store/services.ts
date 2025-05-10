import { chargeBattery, dischargeBattery } from '../utils/battery.js';
import { SharedData } from './shared-data.js';

export const carBatteryService = () => {
  const timer = setInterval(() => {
    const isCharging = !!SharedData.chargingCar.peek();
    const hasUser = !!SharedData.car.peek();
    // If there is no user, do nothing
    if (!hasUser) {
      return;
    }
    if (isCharging) {
      chargeBattery();
      return;
    }

    // Discharge battery on every 3 seconds
    dischargeBattery();
  }, 3000);
  return () => {
    clearInterval(timer);
  };
};
