Cell.propTypes = {
  item: shape({ key: string }).isRequired,
  renderItem: func.isRequired,
  activationTreshold: number,
  onActivate: func,
  height: number,
  width: number,
  active: bool,
  position: oneOfType([object, bool]),
  rotation: oneOfType([object, bool]),
};