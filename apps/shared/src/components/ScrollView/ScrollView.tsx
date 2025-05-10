import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Text, useInput } from 'ink';
import { View, type ViewStyles } from '../View/View.js';
import { Logger } from '../../../../shared/index.js';

type Layout = { width: number; height: number };

export type ScrollViewRef = {
  scrollTo: (
    options?: { x?: number; y?: number; animated?: boolean } | number,
  ) => void;
  getScrollOffset: () => number;
  getViewportSize: () => number;
};

interface ScrollViewProps {
  readonly children?: React.ReactElement | React.ReactElement[];
  readonly style?: ViewStyles;
  onLayout?: (nativeEvent: {
    layout: { width: number; height: number };
  }) => void;
}

const initialLayout = {
  height: 0,
  width: 0,
};

export const ScrollView = forwardRef<ScrollViewRef, ScrollViewProps>(
  (props, ref) => {
    const { children } = props;
    const [scrollL, setScrollL] = useState<Layout>(initialLayout);
    const [contentl, setContentL] = useState<Layout>(initialLayout);
    // const { isFocused } = useFocus();
    const [margin, setMargin] = useState(0);

    useImperativeHandle(ref, () => ({
      scrollTo(options) {
        if (typeof options === 'number') {
          setMargin(options);
          return;
        }
        if (options?.y) {
          setMargin(options.y);
        }
      },
      getScrollOffset() {
        return margin;
      },
      getViewportSize() {
        return scrollL.height;
      },
    }));

    const MAX_SIZE_TO_SCROLL = (() => {
      if (contentl.height < scrollL.height) {
        return 0;
      }
      return contentl.height - scrollL.height;
    })();

    useInput(
      (_input, key) => {
        // Logger.debug('key: ', input, key);
        if (key.upArrow) {
          if (margin === 0) {
            return;
          }
          setMargin(margin - 1);
          return;
          // setMargin(m => {
          // 	if (m === 0) {
          // 		return m;
          // 	}
          // 	return m - 1;
          // });
        }
        if (key.downArrow) {
          if (margin === MAX_SIZE_TO_SCROLL) {
            return;
          }
          setMargin(margin + 1);
          return;
          // setMargin(m => {
          // 	if ((m = MAX_SIZE_TO_SCROLL)) {
          // 		return m;
          // 	}
          // 	return m + 1;
          // });
        }
      },
      {
        isActive: false,
      },
    );

    return (
      <View
        onLayout={event => {
          setScrollL(event.nativeEvent.layout);
        }}
        style={{
          ...scrollViewConatainer,
          // borderColor: isFocused ? 'green' : 'transparent',
          // borderStyle: isFocused ? 'round' : undefined,
          // padding: isFocused ? undefined : 1,
          borderStyle: undefined,
        }}>
        {/* Stats */}
        <ScrollStats
          contentHeight={contentl.height}
          viewportHeight={scrollL.height}
          margin={margin}
          maxmargin={MAX_SIZE_TO_SCROLL}
        />

        <View style={row}>
          {/* Scroll items */}
          <View
            onLayout={event => {
              setContentL(event.nativeEvent.layout);
            }}
            style={{ ...contentConatainer, marginTop: -margin }}>
            {children}
          </View>

          {/* Scrollbar */}
          <View style={scrollBar}>
            {/* Thumb */}
            <Thumb
              viewportSize={scrollL?.height}
              contentSize={contentl?.height}
              scrollbarSize={scrollL?.height}
            />
          </View>
        </View>
      </View>
    );
  },
);

function Thumb(props: {
  viewportSize?: number;
  contentSize?: number;
  scrollbarSize?: number;
}) {
  const { viewportSize = 1, contentSize = 1, scrollbarSize = 1 } = props;
  const thumbSize = calculateThumbSize(
    viewportSize,
    contentSize,
    scrollbarSize,
  );

  Logger.debug(`Thumb: ${thumbSize}`, {
    viewportSize,
    contentSize,
    scrollbarSize,
  });

  return (
    <View
      key={thumbSize}
      style={{
        width: 1,
        height: thumbSize,
        backgroundColor: 'blue',
      }}
    />
  );
}

function ScrollStats(props: {
  viewportHeight: number;
  contentHeight: number;
  margin: number;
  maxmargin: number;
}) {
  const { contentHeight, viewportHeight, margin, maxmargin } = props;
  return (
    <View
      style={{
        flexDirection: 'row',
        columnGap: 1,
        marginTop: -1,
        paddingLeft: 1,
        backgroundColor: 'gray',
        display: 'none',
      }}>
      <Text>Scrollview size: {viewportHeight}</Text>
      <Text>Content size: {contentHeight}</Text>
      <Text>Margin: {margin}</Text>
      <Text>maxmargin: {maxmargin}</Text>
    </View>
  );
}

export function calculateThumbSize(
  viewportSize: number,
  contentSize: number,
  scrollbarSize: number,
): number {
  let s = contentSize;
  if (contentSize === 0) {
    Logger.error('Content size cannot be zero.');
    // throw new Error('Content size cannot be zero.');
    s = 1;
  }
  const ratio = viewportSize / s;
  const thumbSize = Math.floor(scrollbarSize * ratio);
  if (thumbSize > scrollbarSize) {
    return 0;
  }
  return thumbSize >= 1 ? thumbSize : 1;
}

const scrollViewConatainer: ViewStyles = {
  borderStyle: 'round',
  flexBasis: 0,
  flexGrow: 1,
  flexShrink: 1,
  overflow: 'hidden',
  overflowY: 'hidden',
  // flexDirection: 'row',
};
const contentConatainer: ViewStyles = {
  // backgroundColor: 'gray',
  alignSelf: 'flex-start',
  flexBasis: 0,
  flexGrow: 1,
  flexShrink: 1,
  overflow: 'hidden',
};
const scrollBar: ViewStyles = {
  height: '100%',
  // borderStyle: 'single',
  // width: 1,
  // backgroundColor: 'blue',
};
const row: ViewStyles = {
  flexDirection: 'row',
  flexBasis: 0,
  flexGrow: 1,
  flexShrink: 1,
  // borderStyle: 'single',
  // borderColor: 'magenta',
  // height: '100%',
};

/**
 * Scroll to item position in a ScrollView
 * @param itemSize Size of all items in the list (variable height is not supported)
 * @param index The index of the item to scroll to
 * @param scrollRef The reference to the ScrollView
 * @returns
 */
export function scrollToItemPosition(
  itemSize: number,
  index: number,
  scrollRef: ScrollViewRef | null,
) {
  if (!scrollRef) {
    return;
  }
  const startOffset = scrollRef.getScrollOffset();
  const viewportHeight = scrollRef.getViewportSize();
  const itemOffset = index * itemSize;
  const isVisible =
    itemOffset >= startOffset &&
    itemOffset + itemSize <= startOffset + viewportHeight;

  // Logger.error(
  //   'Item offset: ' + itemOffset,
  //   ' - Start' + startOffset,
  //   ' - Viewport' + viewportHeight,
  // );
  if (isVisible) {
    // Logger.error('Item is visible');
    return;
  }
  // past item
  if (itemOffset < startOffset) {
    // Logger.error('Item is not visible, scrolling to top');
    scrollRef.scrollTo(itemOffset);
    return;
  }
  /**
   * Item is not visible, scrolling to bottom
   */
  const bottomOffset = startOffset + viewportHeight;
  const diff = itemOffset - bottomOffset;
  // Logger.error('Item is not visible, scrolling to bottom', {
  //   bottomOffset,
  //   diff,
  //   final: startOffset + diff + itemSize,
  // });
  scrollRef.scrollTo(startOffset + diff + itemSize);
}
