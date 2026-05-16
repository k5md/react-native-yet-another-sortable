import * as React from 'react';
import { SortableGrid, SortableGridProps } from './Grid';
import { Item } from './shared';

export interface CellProps<T extends Item, K extends React.Key = React.Key> {
  item: T,
  onActivate: (key: React.Key) => void
  renderItem: (item: T) => React.ReactNode,
  rowHeight: number,
  active: boolean,
  getActiveStyle: (animation: Animated.Value) => React.CSSProperties | undefined,
  activationProgress: Animated.Value,
  columns: number,
  blockWidth: number,
  grid: SortableGrid<T, K>,
  activationThreshold: number,
}

export class Cell<T extends Item = any, K extends React.Key = React.Key> extends React.PureComponent<CellProps<T, K>> {}
