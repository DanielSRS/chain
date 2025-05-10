import { createContext } from 'react';

interface ViewPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
}

export const ViewPositionContext = createContext<ViewPosition>({
  height: 0,
  width: 0,
  x: 0,
  y: 0,
  level: 0,
});

export const ViewPositionProvider = ViewPositionContext.Provider;
