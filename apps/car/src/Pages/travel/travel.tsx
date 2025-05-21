import React from 'react';
import { Logger, View } from '../../../../shared/index.js';
import { Text, useFocus, useInput } from 'ink';
import { FLEX1 } from '../../../../shared/src/utils/constants.js';
import { useTravelData } from './travel.data.js';
import SelectInput from 'ink-select-input';
import { TravelMachine } from './travel.machine.js';
import { useMachine } from '@xstate/react';
import { z } from 'zod';

const log = Logger.extend('TravelPage');

// interface TravelProps {
//   onDepartureButtonPress: () => void;
//   onDestinationButtonPress: () => void;
// }

/**
 * Travel page component.
 * It shows at the top of the screen the current location and the destination.
 * It also shows the distance and the time to get there.
 * It shows alist of the avaliable routes to get there.
 * It shows the cost of each route.
 */
export function Travel() {
  const { getTravelData } = useTravelData();
  const [state, send] = useMachine(TravelMachine, {
    services: {
      getCities: () => {
        return new Promise(async (resolve, reject) => {
          const res = await getTravelData();
          if (!res.success) {
            reject(res.error);
            return;
          }
          const data = z
            .array(z.string())
            .safeParse(JSON.parse(res.data.payloadString));
          if (data.success) {
            resolve({ cities: data.data });
          } else {
            log.error('Invalid travel data', data);
            reject(data);
          }
        });
      },
      getAvaliableRoutes: () => {
        return new Promise(async resolve => {
          setTimeout(() => {
            resolve({
              routes: 'fsn',
            });
          }, 2001);
        });
      },
    },
  });
  const [showDepartureOptions, setShowDepartureOptions] = React.useState(false);
  const [showDestinationOptions, setShowDestinationOptions] =
    React.useState(false);
  const departure = state.context.departure;
  const destination = state.context.destination;
  const cities = state.context.cities;

  const loadingCities = state.matches('LoadingCities');
  const failedToLoadCities = state.matches('GetCitiesFailed');
  const canShowDepartureOptions =
    state.matches('CitiesLoaded') && showDepartureOptions;

  if (loadingCities) {
    return (
      <View
        style={{
          ...FLEX1,
          borderStyle: 'single',
          borderColor: 'white',
          backgroundColor: 'black',
          padding: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Loading cities...</Text>
      </View>
    );
  }
  if (failedToLoadCities) {
    return (
      <View
        style={{
          ...FLEX1,
          borderStyle: 'single',
          borderColor: 'white',
          backgroundColor: 'black',
          padding: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text>Load cities error...</Text>
      </View>
    );
  }

  return (
    <View
      style={{
        ...FLEX1,
        borderStyle: 'single',

        borderColor: 'white',
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <TravelButton
          text={departure ? 'Origem: ' + departure : 'Origem'}
          onPress={async () => {
            setShowDepartureOptions(true);
          }}
        />
        <TravelButton
          disabled={!!departure}
          text={destination ? 'Destino: ' + destination : 'Destino'}
          onPress={async () => {
            setShowDestinationOptions(true);
          }}
        />
      </View>

      {canShowDepartureOptions ? (
        <View>
          <SelectInput
            items={[
              {
                label: 'Nenhum',
                value: '',
              },
              ...cities.map(c => ({
                label: c,
                value: c,
              })),
            ]}
            initialIndex={0}
            onSelect={item => {
              log.debug('Selected item', item);
              setShowDepartureOptions(false);
              send({
                type: 'SELECT_DEPARTURE',
                data: { departure: item.value },
              });
              // setDeparture(item.value);
            }}
          />
        </View>
      ) : (
        <></>
      )}

      {showDestinationOptions && !!departure ? (
        <View>
          <SelectInput
            items={[
              {
                label: 'Nenhum',
                value: '',
              },
              ...cities
                .filter(c => c !== departure)
                .map(c => ({
                  label: c,
                  value: c,
                })),
            ]}
            initialIndex={0}
            onSelect={item => {
              send({
                type: 'SELECT_DESTINATION',
                data: { destination: item.value },
              });
              setShowDestinationOptions(false);
              // setDestination(item.value);
            }}
          />
        </View>
      ) : (
        <></>
      )}
    </View>
  );
}

interface TravelButtonProps {
  // The text to show in the button
  text: string;
  // The function to call when the button is pressed
  onPress: () => void;
  disabled?: boolean;
}

function TravelButton(props: TravelButtonProps) {
  const { text, onPress, disabled = false } = props;
  const { isFocused } = useFocus({
    autoFocus: true,
    isActive: disabled,
  });
  useInput((_, key) => {
    if (isFocused && key.return) {
      log.debug('TravelButton: onPress');
      onPress();
    }
  });

  return (
    <View
      style={{
        borderStyle: 'single',
        borderColor: isFocused ? 'green' : 'white',
        backgroundColor: isFocused ? 'green' : 'black',
        ...FLEX1,
      }}>
      <Text>{text}</Text>
    </View>
  );
}
