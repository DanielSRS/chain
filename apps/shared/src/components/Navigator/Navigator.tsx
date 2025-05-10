import React, { createContext, useContext, useState } from 'react';
import { Logger } from '../../utils/utils.js';
import { View } from '../View/View.js';
import { Text } from 'ink';
import { FLEX1 } from '../../utils/constants.js';

// Types for our navigation system
type RouteParams = Record<string, unknown>;
type Route = {
  name: string;
  params?: RouteParams;
};

type NavigationState = {
  routes: Route[];
  index: number;
};

type NavigationContextType = {
  state: NavigationState;
  navigate: (name: string, params?: RouteParams) => void;
  goBack: () => boolean;
};

// Create context for the navigator
const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined,
);

// Custom hook to use navigation
export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

// Screen registry to map route names to components
type ScreensConfig = Record<string, React.ComponentType<unknown>>;

interface NavigatorProps {
  initialRouteName: string;
  screens: ScreensConfig;
}

export const Navigator: React.FC<NavigatorProps> = ({
  initialRouteName,
  screens,
}) => {
  // Initialize state with the initial route
  const [state, setState] = useState<NavigationState>({
    routes: [{ name: initialRouteName }],
    index: 0,
  });

  // Navigation functions
  const navigate = (name: string, params?: RouteParams) => {
    if (!screens[name]) {
      Logger.error(`Screen "${name}" is not registered!`);
      return;
    }

    setState(prevState => ({
      routes: [...prevState.routes, { name, params }],
      index: prevState.routes.length,
    }));
  };

  const goBack = () => {
    if (state.index <= 0) return false;

    setState(prevState => ({
      routes: prevState.routes,
      index: prevState.index - 1,
    }));
    return true;
  };

  // Get the current route and screen component
  const currentRoute = state.routes[state.index]!; // Non-null assertion
  const CurrentScreen = screens[currentRoute.name];

  // Provide navigation context and render current screen
  return (
    <NavigationContext.Provider value={{ state, navigate, goBack }}>
      <View style={FLEX1}>
        {CurrentScreen ? (
          <CurrentScreen {...(currentRoute.params || {})} />
        ) : (
          <View>
            <Text>Screen not found: {currentRoute.name}</Text>
          </View>
        )}
      </View>
    </NavigationContext.Provider>
  );
};

// Screen component to easily define screens
export interface ScreenProps {
  name: string;
  component: React.ComponentType<unknown>;
}

// Example usage:
/*
const App = () => {
  const screens = {
    Home: HomeScreen,
    Details: DetailsScreen,
    Profile: ProfileScreen,
  };

  return (
    <Navigator initialRouteName="Home" screens={screens} />
  );
};

// In a screen component:
const HomeScreen = () => {
  const navigation = useNavigation();
  
  return (
    <div>
      <h1>Home Screen</h1>
      <button onClick={() => navigation.navigate('Details', { itemId: 123 })}>
        Go to Details
      </button>
    </div>
  );
};
*/
