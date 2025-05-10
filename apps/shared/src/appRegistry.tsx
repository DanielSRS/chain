import React from 'react';
import { render } from 'ink';
import { Screen } from './components/screen/screen.js';
import { ResizableRootContainer } from './components/resizableRootContainer/resizableRootContainer.js';

function registerComponent(_appName: string, App: () => React.JSX.Element) {
  render(
    <Screen>
      <ResizableRootContainer>
        <App />
      </ResizableRootContainer>
    </Screen>,
  );
}

export const AppRegistry = {
  registerComponent,
};
