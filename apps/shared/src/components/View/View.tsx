import React from 'react';
import { Box, measureElement, Text, BoxProps, useStdout } from 'ink';
import { cloneElement, useEffect, useMemo, useRef, useState } from 'react';
import type { DOMElement } from 'ink';
import type { ComponentProps } from 'react';

export type ViewStyles = Omit<BoxProps, 'children' | 'key'> & {
  readonly backgroundColor?: Color;
};

type Color = ComponentProps<typeof Box>['borderColor'];
interface ViewProps {
  readonly children?: React.ReactElement | React.ReactElement[];
  readonly style?: ViewStyles;
  onLayout?: (event: {
    nativeEvent: {
      layout: { width: number; height: number };
    };
  }) => void;
}

export function View(props: ViewProps) {
  const { style, onLayout } = props;
  const childrenContainerRef = useRef<DOMElement>(null);
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    height: 0,
    width: 0,
  });

  function calcSize() {
    if (!childrenContainerRef.current) {
      return;
    }

    const newSize = measureElement(childrenContainerRef.current);
    setSize(newSize);
    onLayout?.({
      nativeEvent: {
        layout: newSize,
      },
    });
  }

  useEffect(calcSize, []);
  useEffect(() => {
    stdout.on('resize', calcSize);

    return () => {
      stdout.removeListener('resize', calcSize);
    };
  }, [stdout]);

  const bg = useMemo(() => {
    // No bg to set
    if (!props.style?.backgroundColor) {
      return null;
    }

    const a: React.JSX.Element[] = [];
    for (let index = 0; index < size.height; index++) {
      a.push(
        <Text backgroundColor={props.style.backgroundColor} key={index}>
          {' '.repeat(size.width)}
        </Text>,
      );
    }

    return a;
  }, [size.width, size.height, props.style?.backgroundColor]);

  const newChildren = useMemo(() => {
    // There is no children
    if (!props.children) {
      return props.children;
    }

    // There is no bg color to set
    if (!props.style?.backgroundColor) {
      return props.children;
    }

    // There is multiple children
    if (Array.isArray(props.children)) {
      return props.children.map(addBgColor(props.style.backgroundColor));
    }

    return addBgColor(props.style.backgroundColor)(props.children, 39485);
  }, [props.children, props.style?.backgroundColor]);

  return (
    <Box
      {...style}
      ref={childrenContainerRef}
      flexDirection={undefined}
      overflow="hidden"
      alignItems={undefined}
      columnGap={undefined}
      justifyContent={undefined}
      rowGap={undefined}
      padding={undefined}
      paddingBottom={undefined}
      paddingLeft={undefined}
      paddingRight={undefined}
      paddingTop={undefined}
      paddingX={undefined}
      paddingY={undefined}
      gap={undefined}
      flexWrap={undefined}
      display="flex"
      flexShrink={style?.flexShrink ?? 0}>
      {/* Background */}
      <Box
        position="absolute"
        flexDirection="column"
        flexGrow={1}
        flexBasis={0}
        flexShrink={1}
        width={size.width}
        height={size.height}>
        {bg}
      </Box>
      {/* Children container */}
      <Box
        {...style}
        flexDirection={style?.flexDirection ?? 'column'}
        flexGrow={1}
        borderStyle={undefined}
        alignSelf={undefined}
        margin={undefined}
        marginBottom={undefined}
        marginLeft={undefined}
        marginRight={undefined}
        marginTop={undefined}
        marginX={undefined}
        marginY={undefined}
        // FlexBasis={0}
        // FlexGrow={1}
        position={undefined}>
        {newChildren}
      </Box>
    </Box>
  );
}

/**
 * If children has no bg color, clone it and sets one,
 * otherwise, just return it without changing
 */
const addBgColor =
  (bgColor: Color) => (children: React.ReactElement, index: number) => {
    const childrenBgColor = children.props.backgroundColor as unknown;
    const childrenBgColor2 = children.props.style?.backgroundColor as unknown;
    const hasBgColor = !!childrenBgColor || !!childrenBgColor2;
    if (hasBgColor) {
      return children;
    }

    const clone = cloneElement(children, {
      backgroundColor: bgColor,
      style: {
        ...children.props.style,
        backgroundColor: bgColor,
      },
      key: index + 234,
    });
    return clone;
  };
