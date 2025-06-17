import React, { useState } from 'react';
import SelectInput from 'ink-select-input';
import { View } from '../../../../shared/index.js';
import { Logger } from '../../../../shared/index.js';
import { mqttHelpers } from '../../api/mqtt-helpers.js';
import { SharedData } from '../../store/shared-data.js';
import { Text, useInput } from 'ink';
import { calculateDistance } from '../../../../shared/src/utils/location.js';
import type { ErrorCode } from '../../../../shared/src/utils/error-codes.js';
import type { TCPResponse } from '../../../../shared/index.js';
import type {
  Station,
  Response,
  Car,
  ErrorResponse,
} from '../../../../shared/src/utils/main.types.js';

const FLEX1 = { flexBasis: 0, flexGrow: 1, flexShrink: 1 } as const;

export function ReserveStation(props: {
  station: Station;
  car: Car;
  onGoBack: () => void;
}) {
  const { station, onGoBack, car } = props;
  const [response, setResponse] =
    useState<
      TCPResponse<Response<undefined> | ErrorResponse<undefined | ErrorCode>>
    >();
  const isAvaliable = station.state === 'avaliable';
  const isReserved = station.state === 'reserved'; // Verifies if the station has reserves in the queue
  const isTheFirstInQueue = station.reservations[0] === car.id; // Verifies if the user reserve has the highest priority in the queue

  useInput((input, key) => {
    if (key.backspace) {
      onGoBack();
    }
    if (input === 'v') {
      onGoBack();
    }
  });

  const startCharging = async () => {
    // Start loading
    const res = await mqttHelpers.startCharging({
      stationId: station.id,
      userId: car.id,
      battery_level: SharedData.car.batteryLevel.peek() ?? 50,
    });

    if (res.type === 'success') {
      if ('success' in res.data && res.data.success && 'data' in res.data) {
        SharedData.chargingCar.set(res.data.data);
        SharedData.reservedStation.set(undefined);
      } else {
        Logger.error('startCharging api error: ', res.data);
      }
    } else {
      Logger.error('startCharging MQTT error: ', res.message, res.error);
    }
    // End loading
  };

  const reserve = async () => {
    // Start loading
    const res = await mqttHelpers.reserve({
      stationId: station.id,
      userId: car.id,
    });

    if (res.type === 'success') {
      if ('success' in res.data && res.data.success) {
        SharedData.reservedStation.set(station);
        SharedData.reservedStation.reservations.push(car.id);
      }
    }
    setResponse(
      res as TCPResponse<
        Response<undefined> | ErrorResponse<undefined | ErrorCode>
      >,
    );
    // End loading
  };

  return (
    <View style={FLEX1}>
      <View style={{ backgroundColor: 'black', padding: 1 }}>
        <Text color={'white'}>{'<--'} Press v to go back</Text>
      </View>
      {/* Station info */}
      <View
        style={
          {
            // borderStyle: 'round',
            // borderColor: isFocused ? 'green' : undefined,
          }
        }>
        <Text>Name: {station.id}</Text>
        <Text>State: {station.state}</Text>
        <Text>Queue: {station.reservations.length}</Text>
        {/* <Text>
					Queue position:{' '}
					{station.reservations.findIndex(id => id === car.id) + 1}
				</Text> */}
        <Text>
          Distance:{' '}
          {calculateDistance(station.location, car.location).toFixed(2)}u
        </Text>
        {/* <Text>Tipo: {station.type}</Text>
						<Text>Preço: {station.price}</Text> */}
      </View>
      <SelectInput
        items={[
          {
            label: 'Reservar',
            value: 'reserve',
          },
          isAvaliable || (isReserved && isTheFirstInQueue)
            ? {
                label: 'Iniciar recarga',
                value: 'charge',
              }
            : undefined,
          {
            label: 'Cancelar',
            value: 'cancel',
          },
        ].filter(v => v !== undefined)}
        onSelect={item => {
          if (item.value === 'reserve') {
            reserve();
          }
          if (item.value === 'charge') {
            startCharging();
          }
        }}
      />

      {/* Resopnse */}
      <View style={{ backgroundColor: 'red', paddingLeft: 1, paddingRight: 1 }}>
        <Text>Response</Text>
      </View>
      <View style={FLEX1}>
        {!!response ? (
          JSON.stringify(response, null, 2)
            .split('\n')
            .map(line => <Text>{line}</Text>)
        ) : (
          <Text></Text>
        )}
      </View>
    </View>
  );
}
