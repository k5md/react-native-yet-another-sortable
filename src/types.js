import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';

export const SortableGridPropTypes = {
  blockTransitionDuration: number,
  activeBlockCenteringDuration: number,
  itemsPerRow: number,
  dragActivationTreshold: number,
  itemOrder: arrayOf(number),
  children: arrayOf(
    shape({
      key: string,
    }),
  ),
  onDragRelease: func,
  blockHeight: number,
  style: object,
};

export const SortableGridDefaultProps = {
  blockTransitionDuration: 300,
  activeBlockCenteringDuration: 200,
  itemsPerRow: 4,
  dragActivationTreshold: 200,
  onDragRelease: () => {},
  style: {},
};
