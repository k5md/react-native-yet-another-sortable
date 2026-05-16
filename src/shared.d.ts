import * as React from 'react';

export interface Item<K extends React.Key = React.Key> {
  /** key used to order items */
  key: K,
  /** makes cell not draggable, still allowing it to be swapped with other cells */
  dragDisabled?: boolean,
  [key: string]: any,
}
