import { Logger } from '../../../shared/index.js';
import { saveUserToStorage, SharedData } from '../store/shared-data.js';

/**
 * Discharge the battery, but only if it's not already at 0 or charging
 */
export function dischargeBattery() {
  Logger.info('Discharge battery');
  const isCharging = !!SharedData.chargingCar.peek();

  /**
   * 	* If the car is charging, do nothing
   */
  if (isCharging) {
    return;
  }

  const currentBatteryLevel = SharedData.car.batteryLevel.peek() ?? 0;
  const nextBatteryLevel =
    currentBatteryLevel > 0 ? currentBatteryLevel - 1 : 0;

  SharedData.car.batteryLevel.set(nextBatteryLevel);
  saveUserToStorage(SharedData.car.peek()!);
}

/**
 * Charge the battery
 */
export function chargeBattery() {
  Logger.info('Charge battery');
  const currentBatteryLevel = SharedData.car.batteryLevel.peek() ?? 0;
  const nextBatteryLevel =
    currentBatteryLevel < 100 ? currentBatteryLevel + 1 : 100;
  SharedData.car.batteryLevel.set(nextBatteryLevel);
  saveUserToStorage(SharedData.car.peek()!);
}
