import React, { useState } from 'react';
import { Tabs, Tab } from 'ink-tab';
import { FLEX1 } from './constants.js';
import { Recomendations } from './Pages/Recomendations/Recomendations.js';
import { Computed, Memo } from '@legendapp/state/react';
import { SharedData } from './store/shared-data.js';
import { ReserveStation } from './Pages/ReserveStation/ReserveStation.js';
import { Charging } from './Pages/Charging/Charging.js';
import { View } from '../../shared/index.js';
import { About } from './Pages/about/about.js';
import { General } from './Pages/geeneral/general.js';
import { PaymentRoutes } from './routes/payment-routes.js';

type TabName = 'general' | 'foo' | 'bar' | 'baz' | 'about';

const TABS = {
  about: {
    name: 'Sobre',
    component: () => <About />,
  },
  bar: {
    name: 'Recomendações',
    component: () => (
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
  },
  baz: {
    name: 'Pagamento',
    component: () => (
      <View style={{ ...FLEX1, paddingTop: 0 }}>
        <PaymentRoutes />
      </View>
    ),
  },
  foo: {
    name: 'Carregamento',
    component: () => <Charging />,
  },
  general: {
    name: 'Geral',
    component: () => (
      <Computed>{() => <General car={SharedData.car.get()!} />}</Computed>
    ),
  },
} satisfies Record<TabName, TabContent>;

type TabContent = {
  name: string;
  component: () => React.ReactNode;
};

const tabs = Object.entries(TABS);

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

  return (
    <View style={FLEX1}>
      <Tabs
        onChange={handleTabChange}
        defaultValue="general"
        children={tabs.map(([key, tab]) => {
          return (
            <Tab key={key} name={key}>
              {tab.name}
            </Tab>
          );
        })}
        keyMap={{
          useTab: false,
        }}
      />
      <>
        {tabs.map(([key, { component: Tab }]) => {
          const isActive = activeTabName === key;
          return (
            <View
              key={key}
              style={{
                display: isActive ? 'flex' : 'none',
                position: isActive ? 'relative' : 'absolute',
                ...FLEX1,
              }}>
              <Memo>
                <Tab />
              </Memo>
            </View>
          );
        })}
      </>
      {/* <View style={FLEX1}>{ActiveTabContent}</View> */}
    </View>
  );
}
