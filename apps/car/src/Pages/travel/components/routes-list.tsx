import React, { useRef } from 'react';
import { Text } from 'ink';
import {
  Logger,
  scrollToItemPosition,
  ScrollView,
} from '../../../../../shared/index.js';
import { RouteItem } from './route-item.js';
import type { ScrollViewRef } from '../../../../../shared/index.js';
import { FLEX1 } from '../../../constants.js';

export interface PathResult {
  path: string[];
  cost: number;
}

export const RoutesList = (props: {
  routes: readonly PathResult[];
  onSelectStation?: (station: PathResult) => void;
}) => {
  const { routes, onSelectStation } = props;
  const scrollRef = useRef<ScrollViewRef>(null);
  if (routes.length === 0) {
    return <Text>Sem rotas</Text>;
  }
  return (
    <ScrollView ref={scrollRef} style={FLEX1}>
      {routes.map((route, index) => (
        <RouteItem
          key={index}
          index={index}
          route={route}
          onFocus={() => {
            scrollToItemPosition(3, index, scrollRef.current);
          }}
          onPress={() => {
            Logger.info('Selected station: ', route);
            onSelectStation?.(route);
          }}
        />
      ))}
    </ScrollView>
  );
};
