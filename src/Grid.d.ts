SortableGrid.propTypes = {
  order: arrayOf(string).isRequired,
  data: arrayOf(shape({ key: string })).isRequired,
  rowHeight: number,
  columns: number,
  activationThreshold: number,
  transitionDuration: number,
  renderItem: func.isRequired,
  onGrantBlock: func,
  onMoveBlock: func,
  onReleaseBlock: func,
  onActivateDrag: func,
  onDeactivateDrag: func,
};