import * as React from 'react';
import { SortableGrid, SortableGridProps } from './Grid';
import { Item } from './shared';

export interface CellProps<T, K extends React.Key = React.Key> {
  item: T & Item<K>,
  onActivate: (key: K) => void
  renderItem: (item: T & Item<K>) => React.ReactNode,
  rowHeight: number,
  active: boolean,
  getActiveStyle: (animation: Animated.Value) => React.CSSProperties | undefined,
  activationProgress: Animated.Value,
  columns: number,
  blockWidth: number,
  grid: SortableGrid<T, K>,
  activationThreshold: number,
}

export class Cell<T, K extends React.Key = React.Key> extends React.PureComponent<CellProps<T, K>> {}
