import React, { useRef } from 'react';
import { Text } from 'ink';
import {
  Logger,
  scrollToItemPosition,
  ScrollView,
} from '../../../../../shared/index.js';
import { Suggestion } from './suggestion.js';
import { calculateDistance } from '../../../../../shared/src/utils/location.js';
import type {
  Position,
  Station,
} from '../../../../../shared/src/utils/main.types.js';
import type { ScrollViewRef } from '../../../../../shared/index.js';

export const SuggestionsList = (props: {
  suggestions: Station[];
  location: Position;
  onSelectStation?: (station: Station) => void;
}) => {
  const { suggestions, onSelectStation, location } = props;
  const scrollRef = useRef<ScrollViewRef>(null);
  if (suggestions.length === 0) {
    return <Text>Sem sugestões</Text>;
  }
  return (
    <ScrollView ref={scrollRef}>
      {suggestions.map((station, index) => (
        <Suggestion
          key={index}
          station={station}
          distance={calculateDistance(station.location, location).toFixed(2)}
          onFocus={() => {
            scrollToItemPosition(6, index, scrollRef.current);
          }}
          onPress={() => {
            Logger.info('Selected station: ', station);
            onSelectStation?.(station);
          }}
        />
      ))}
    </ScrollView>
  );
};
