import * as React from 'react';
import { Animated, PanResponderCallbacks } from 'react-native';
import { CellProps } from './Cell';
import { Item } from './shared';

export interface SortableGridProps<T extends Item> {
  /** array of items each to be passed to `renderItem` */
  items: T[],
  /** array of item `key` properties specifying items order in grid */
  order: React.Key[],
  /** render function for each item */
  renderItem: (item: any & { key: React.Key }) => React.ReactNode,
  /** row height in pixels */
  rowHeight: number,
  /** number of columns per row */
  columns: number,
  /** hold time in ms required to activate drag */
  activationThreshold: number,
  /** time in ms required to move cell to its position on release or swap */
  transitionDuration: number,
  /** will execute after one holds the item for `activateTreshold` ms, before `onGrantBlock`, return truthy value to override default behaviour */
  onActivateDrag: (key: React.Key, gridInstance: SortableGrid<T>) => any,
  /** will execute on drag start, return truthy value to override default behaviour */
  onGrantBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderGrant']>, gridInstance: SortableGrid<T> ]
  ) => any;
  /** will execute on every move, return truthy value to override default behaviour */
  onMoveBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderMove']>, gridInstance: SortableGrid<T> ]
  ) => any;
  /** will execute on drag release, return truthy value to override default behaviour */
  onReleaseBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderRelease']>, gridInstance: SortableGrid<T> ]
  ) => any;
  /** will execute on active item drop, after `onReleaseBlock`, with new order array as argument, return truthy value to override default behaviour  */
  onDeactivateDrag: (order: React.Key[], gridInstance: SortableGrid<T>) => any,
  /**
   * provides styles for cell from `animation`, use it to achieve custom activation effects.
   * If not provided, defaults to rotation and elevation:
   * ```
   * (animation) => ({
   *  transform: [ { rotate: animation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) } ],
   *  elevation: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
   * })
   * ```
  */
  getActiveStyle: CellProps<T>['getActiveStyle'],
  /**
   * animates `animation` value, returns requestAnimationFrame identifier or nothing for cleanup, use it to achieve custom activation effects.
   * If not provided defaults to:
   * ```
   * (animation) => requestAnimationFrame(() => {
   *  animation.setValue(10);
   *  Animated.spring(animation, { toValue: 0, velocity: 2000, tension: 2000, friction: 5, useNativeDriver: true }).start();
   * })
   * ```
  */
  animateActiveStyle: (animation: Animated.Value) => number | undefined,
  /** number of pixels to autoscroll when item is held close to upper or lower boundary of container */
  scrollStep: number,
  /** set of keys for cells that will not be swapped with others */
  pinned: Set<React.Key>,
}

/**
 * Renders `items` as grid by passing each item to `renderItem`. Each item must have unique `key` property.
 * Cell order must be provided in `order` array of keys. After user rearranges grid cells by dragging,
 * `onDeactivateDrag` callback gets called with updated order as an argument. Activation animation can be customized with
 * `animateActiveStyle` and `getActiveStyle` props.
 *
 * ```
 * import React, { useState } from 'react';
 * import { View, Text } from 'react-native';
 * import { SortableGrid } from 'react-native-yet-another-sortable';
 * const Component = () => {
 *   const [ items, setItems ] = useState(Array.from({ length: 5 }, (_, i) => ({ value: i, key: i })));
 *   const [ order, setOrder ] = useState(items.map(({ key }) => key));
 *   return (
 *     <SortableGrid
 *       items={items}
 *       order={order}
 *       renderItem={({ value }) => (<View><Text>{value}</Text></View>)}
 *       onDeactivateDrag={(order) => setOrder(order)}
 *     />
 *   );
 * };
 * ```
 */
export class SortableGrid<T extends Item = any> extends React.PureComponent<SortableGridProps<T>> {
  static defaultProps: Partial<Omit<SortableGridProps<any>, 'renderItem' | 'items' | 'order'>>;
}
