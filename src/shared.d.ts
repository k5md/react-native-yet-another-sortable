import * as React from 'react';

export interface Item {
  /** key used to order items */
  key: React.Key,
  /** makes cell not draggable, still allowing it to be swapped with other cells */
  dragDisabled?: boolean,
  [key: string]: any,
}
