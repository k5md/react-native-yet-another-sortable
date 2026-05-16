import * as React from 'react';
import { Animated, PanResponderCallbacks } from 'react-native';
import { CellProps } from './Cell';
import { Item } from './shared';

export interface SortableGridProps<T extends Item> {
  items: T[],
  order: React.Key[],
  renderItem: (item: any & { key: React.Key }) => React.ReactNode,
  rowHeight: number,
  columns: number,
  activationThreshold: number,
  transitionDuration: number,
  onGrantBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderGrant']>, gridInstance: SortableGrid<T> ]
  ) => any;
  onMoveBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderMove']>, gridInstance: SortableGrid<T> ]
  ) => any;
  onReleaseBlock: (
    ...args: [ ...Parameters<Required<PanResponderCallbacks>['onPanResponderRelease']>, gridInstance: SortableGrid<T> ]
  ) => any;
  onActivateDrag: (key: React.Key, gridInstance: SortableGrid<T>) => any,
  onDeactivateDrag: (order: React.Key[], gridInstance: SortableGrid<T>) => any,
  getActiveStyle: CellProps<T>['getActiveStyle'],
  animateActiveStyle: (animation: Animated.Value) => number | undefined,
  scrollStep: number,
}

export class SortableGrid<T extends Item = any> extends React.PureComponent<SortableGridProps<T>> {
  static defaultProps: Partial<Omit<SortableGridProps<any>, 'renderItem' | 'items' | 'order'>>;
}
