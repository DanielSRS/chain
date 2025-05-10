import React from 'react';
import { Text, useInput } from 'ink';
import type {
  Station,
  Position,
} from '../../../../shared/src/utils/main.types.js';
// import { Logger } from '../../utils/utils.js';
import { FLEX1 } from '../../constants.js';
import { SuggestionsList } from './components/suggestions-list.js';
import { use$ } from '@legendapp/state/react';
import { getSuggestions, SharedData } from '../../store/shared-data.js';
import { View } from '../../../../shared/index.js';
import type { ViewStyles } from '../../../../shared/index.js';

// const log = Logger.extend('Recomendations');

interface RecomendationsProps {
  location: Position;
  onSelectStation: (station: Station) => void;
}

export function Recomendations(props: RecomendationsProps) {
  const { location, onSelectStation } = props;
  const suggestions = use$(SharedData.suggestions) ?? [];

  const retrieveSuggestions = () => {
    getSuggestions(location, SharedData.suggestions.set);
  };

  useInput(input => {
    if (input === 's') {
      retrieveSuggestions();
    }
  });

  return (
    <View style={container}>
      <View
        style={{
          ...FLEX1,
          // Header size
          marginTop: 5,
        }}>
        <SuggestionsList
          suggestions={suggestions}
          location={location}
          onSelectStation={s => {
            // Atualiza as sugestões apos voltar da página de reserva
            // Caso o usuário tenha reservado algum posto
            setTimeout(() => {
              retrieveSuggestions();
            }, 500);
            onSelectStation(s);
          }}
        />
      </View>
      {/* Header */}
      <View
        style={{
          position: 'absolute',
          width: '100%',
          padding: 1,
          backgroundColor: 'black',
        }}>
        <View>
          <Text>
            Press <Text color={'red'}>q</Text> to exit
          </Text>
        </View>
        <View>
          <Text>
            Press <Text color={'blue'}>s</Text> to get suggestions
          </Text>
        </View>
      </View>
    </View>
  );
}

const container: ViewStyles = {
  flexBasis: 0,
  flexShrink: 1,
  flexGrow: 1,
  overflow: 'hidden',
  // borderStyle: 'round',
};
