import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';

export const SortableGridPropTypes = {
  transitionDuration: number,
  columns: number,
  activationThreshold: number,
  order: arrayOf(string).isRequired,
  children: arrayOf(
    shape({
      key: string,
    }),
  ),
  onDragRelease: func,
  blockHeight: number.isRequired,
  style: object,
};

export const SortableGridDefaultProps = {
  transitionDuration: 200,
  columns: 4,
  activationThreshold: 200,
  style: {},
};
