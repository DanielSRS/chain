import React, { useMemo, useState } from 'react';
import { Tabs, Tab } from 'ink-tab';
import { FLEX1 } from './constants.js';
import { Recomendations } from './Pages/Recomendations/Recomendations.js';
import { Computed } from '@legendapp/state/react';
import { SharedData } from './store/shared-data.js';
import { ReserveStation } from './Pages/ReserveStation/ReserveStation.js';
import { Charging } from './Pages/Charging/Charging.js';
import { View } from '../../shared/index.js';
import { About } from './Pages/about/about.js';
import { General } from './Pages/geeneral/general.js';
import { PaymentRoutes } from './routes/payment-routes.js';

type TabName = 'general' | 'foo' | 'bar' | 'baz' | 'about';

const TABS = {
  about: <About />,
  bar: (
    <Computed>
      {() => {
        const location = SharedData.car.location.get();
        const car = SharedData.car.get();
        const selectedStation = SharedData.selectedStation.get();
        if (!location || !car) {
          return null;
        }
        if (selectedStation) {
          return (
            <ReserveStation
              station={selectedStation}
              onGoBack={() => SharedData.selectedStation.set(undefined)}
              car={car}
            />
          );
        }
        return (
          <Recomendations
            location={location}
            onSelectStation={SharedData.selectedStation.set}
          />
        );
      }}
    </Computed>
  ),
  baz: (
    <View style={{ ...FLEX1, paddingTop: 0 }}>
      <PaymentRoutes />
    </View>
  ),
  foo: <Charging />,
  general: <Computed>{() => <General car={SharedData.car.get()!} />}</Computed>,
} satisfies Record<TabName, React.ReactNode>;

export function TabNavigation() {
  const [activeTabName, setActiveTabName] = useState<TabName>('general');

  // the handleTabChange method get two arguments:
  // - the tab name
  // - the React tab element
  function handleTabChange(
    name: string,
    // activeTab: React.ReactElement<typeof Tab>,
  ) {
    // set the active tab name to do what you want with the content
    setActiveTabName(name as TabName);
  }

  const ActiveTabContent = useMemo(() => TABS[activeTabName], [activeTabName]);

  return (
    <View style={FLEX1}>
      <Tabs
        onChange={handleTabChange}
        defaultValue="general"
        keyMap={{
          useTab: false,
        }}>
        <Tab name="general">General</Tab>
        <Tab name="foo">Charging</Tab>
        <Tab name="bar">Recomendations</Tab>
        <Tab name="baz">Pagamento</Tab>
        <Tab name="about">About</Tab>
      </Tabs>
      {ActiveTabContent}
    </View>
  );
}
