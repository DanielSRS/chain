import React from 'react';
import { Logger, View } from '../../../../shared/index.js';
import { Text, useFocus, useInput } from 'ink';
import { FLEX1 } from '../../../../shared/src/utils/constants.js';
import { useTravelData } from './travel.data.js';
import SelectInput from 'ink-select-input';

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
  const [showDepartureOptions, setShowDepartureOptions] = React.useState(false);
  // const [showDestinationOptions, setShowDestinationOptions] =
  //   React.useState(false);
  const [departure, setDeparture] = React.useState('');
  // const [destination, setDestination] = React.useState('');
  const [cities, setCities] = React.useState<string[]>([]);

  // const showRoutes = departure || destination;

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
          text={departure ? 'Origem:' + departure : 'Origem'}
          onPress={async () => {
            setShowDepartureOptions(true);
            const res = await getTravelData();
            if (res instanceof Error) {
              log.error('Error getting travel data', res);
              return;
            }
            const data = JSON.parse(res.payloadString);
            log.info('Travel data', data);
            if (Array.isArray(data)) {
              setCities(data);
            } else {
              log.error('Invalid travel data', data);
            }
          }}
        />
        <TravelButton text="Destino" onPress={() => {}} />
      </View>

      {showDepartureOptions ? (
        <View>
          <SelectInput
            items={cities.map(c => ({
              label: c,
              value: c,
            }))}
            initialIndex={cities.indexOf(departure)}
            onSelect={item => {
              log.debug('Selected item', item);
              setShowDepartureOptions(false);
              setDeparture(item.value);
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
}

function TravelButton(props: TravelButtonProps) {
  const { isFocused } = useFocus();
  const { text, onPress } = props;
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
