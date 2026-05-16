import * as React from 'react';

export interface Item {
  /** key used to order items */
  key: React.Key,
  /** makes cell not draggable, still allowing it to be swapped with other cells */
  dragDisabled?: boolean,
  /** does not allow swapping with any other cells */
  moveDisabled?: boolean,
  [key: string]: any,
}
