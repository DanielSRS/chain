import { Box, useStdout } from 'ink';
import React, { useLayoutEffect, useState } from 'react';
import { ViewPositionProvider } from '../../contexts/position-context.js';

type Props = React.PropsWithChildren;

export const ResizableRootContainer: React.FC<Props> = props => {
  const [columns, rows] = useStdoutDimensions();
  return (
    <ViewPositionProvider
      value={{
        x: 0,
        y: 0,
        width: columns,
        height: rows,
        level: 0,
      }}>
      <Box width={columns} height={rows}>
        {props.children}
      </Box>
    </ViewPositionProvider>
  );
};

const useStdoutDimensions = (): [number, number] => {
  const { stdout } = useStdout();
  const [dimensions, setDimensions] = useState<[number, number]>([
    stdout.columns,
    stdout.rows,
  ]);

  useLayoutEffect(() => {
    const handler = () => {
      setDimensions([stdout.columns, stdout.rows]);
    };
    stdout.on('resize', handler);
    return () => {
      stdout.off('resize', handler);
    };
  }, [stdout]);

  return dimensions;
};
