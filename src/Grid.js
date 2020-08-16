import React, { PureComponent } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableHighlightBase } from 'react-native';
import { sortBy, clamp } from 'lodash';
import { animateTiming, animateWiggle } from './utils';
import Cell from './Cell';
import { shape, number, string, arrayOf, func, object } from 'prop-types';

class SortableGrid extends PureComponent {
  itemOrder = {};
  blockPositions = {};
  layout = { height: 0, width: 0 };
  blockWidth = 0;
  panCapture = false;
  panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: () => this.panCapture,
    onMoveShouldSetPanResponderCapture: () => this.panCapture,
    onPanResponderGrant: (evt, gestureState) => this.onGrantBlock(evt, gestureState),
    onPanResponderMove: (evt, gestureState) => this.onMoveBlock(evt, gestureState),
    onPanResponderRelease: (evt, gestureState) => this.onReleaseBlock(evt, gestureState),
  });

  activeBlockOffset = { x: 0, y: 0 };
  activeBlock = null;

  wiggle = new Animated.Value(0);

  UNSAFE_componentWillUpdate = (nextProps) => {
    this.layout.height = nextProps.rowHeight * Math.ceil(nextProps.data.length / nextProps.columns);
    this.blockWidth = Math.floor(this.blockWidth * this.props.columns) / nextProps.columns;

    const oldBlockPositions = Object.keys(this.blockPositions);
    oldBlockPositions.forEach(
      (key) => !nextProps.data.find((child) => child.key === key) && delete this.blockPositions[key],
    );

    this.itemOrder = {};

    nextProps.order.forEach((key, index) => {
      this.itemOrder[key] = { key, order: index };
      const blockPosition = {
        x: (index % nextProps.columns) * this.blockWidth,
        y: Math.floor(index / nextProps.columns) * nextProps.rowHeight,
      };

      if (!this.blockPositions[key]) {
        this.blockPositions[key] = {
          origin: blockPosition,
          currentPosition: new Animated.ValueXY(blockPosition),
        };
      } else {
        if (
          this.blockPositions[key].origin.x === blockPosition.x &&
          this.blockPositions[key].origin.y === blockPosition.y
        ) {
          return;
        }
        this.getBlock(key).origin = blockPosition;
        this.getBlock(key).currentPosition.setValue(blockPosition);
      }
    });
  };

  onGrantBlock = (evt, gestureState) => {
    const override = this.props.onGrantBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    const activeBlockOrigin = this.getActiveBlock().origin;
    this.activeBlockOffset = {
      x: activeBlockOrigin.x - gestureState.x0,
      y: activeBlockOrigin.y - gestureState.y0,
    };
  };

  onMoveBlock = (evt, gestureState) => {
    const override = this.props.onMoveBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    const dragPosition = {
      x: gestureState.moveX + this.activeBlockOffset.x,
      y: gestureState.moveY + this.activeBlockOffset.y,
    };
    const activeBlock = this.getActiveBlock();
    const actualDragPosition = {
      x: clamp(dragPosition.x, 0, this.layout.width - this.blockWidth),
      y: clamp(dragPosition.y, 0, this.layout.height - this.props.rowHeight),
    };
    activeBlock.currentPosition.setValue(actualDragPosition);
    this.moveBlock(activeBlock.origin, actualDragPosition);
  };

  onReleaseBlock = (evt, gestureState) => {
    this.panCapture = false;
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    const activeBlock = this.getActiveBlock();
    const currentPosition = activeBlock.currentPosition;
    const originalPosition = activeBlock.origin;

    animateTiming(currentPosition, originalPosition, this.props.transitionDuration, this.onDeactivateDrag);
  };

  onActivateDrag = (key) => {
    this.panCapture = true;
    this.activeBlock = key;
    const override = this.props.onActivateDrag(this);
    if (override) {
      return;
    }
    animateWiggle(this.wiggle, 10, 0, this.props.transitionDuration);
    this.forceUpdate();
  };

  onDeactivateDrag = () => {
    const itemOrder = sortBy(this.itemOrder, (item) => item.order).map((item) => item.key);
    this.props.onDeactivateDrag(itemOrder, this);
    this.activeBlock = null;
  };

  getDistance = (pointA, pointB) => {
    const xDistance = pointA.x - pointB.x;
    const yDistance = pointA.y - pointB.y;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
  };

  moveBlock = (originalPosition, currentPosition) => {
    const activeBlock = this.getActiveBlock();
    let closest = this.activeBlock;
    let closestDistance = this.getDistance(currentPosition, originalPosition);

    for (let key in this.blockPositions) {
      const block = this.blockPositions[key];
      const blockPosition = block.origin;
      const distance = this.getDistance(currentPosition, blockPosition);
      if (distance < closestDistance && distance < this.blockWidth) {
        closest = key;
        closestDistance = distance;
      }
    }

    if (closest === this.activeBlock) {
      return;
    }

    const closestBlock = this.getBlock(closest);
    animateTiming(closestBlock.currentPosition, activeBlock.origin, this.props.transitionDuration);
    activeBlock.origin = closestBlock.origin;
    closestBlock.origin = originalPosition;

    const tempOrder = this.itemOrder[this.activeBlock].order;
    this.itemOrder[this.activeBlock].order = this.itemOrder[closest].order;
    this.itemOrder[closest].order = tempOrder;
  };

  getActiveBlock = () => this.blockPositions[this.activeBlock];

  getBlock = (key) => this.blockPositions[key];

  blockPositionsSet = () => Object.keys(this.blockPositions).length === this.props.data.length;

  onGridLayout = ({ nativeEvent }) => {
    this.layout.width = nativeEvent.layout.width;
    this.blockWidth = nativeEvent.layout.width / this.props.columns;
    this.forceUpdate();
  };

  getGridStyle = () => [
    styles.grid,
    this.blockPositionsSet() && { height: this.layout.height + this.props.rowHeight },
  ];

  render = () => (
    <Animated.View
      style={this.getGridStyle()}
      onLayout={this.onGridLayout}
      {...this.panResponder.panHandlers}
    >
      {this.props.data.map((item) => (
        <Cell
          key={item.key}
          item={item}
          onActivate={this.onActivateDrag}
          renderItem={this.props.renderItem}
          height={this.props.rowHeight}
          width={this.blockWidth}
          active={this.activeBlock === item.key}
          position={this.blockPositionsSet() && this.blockPositions[item.key].currentPosition}
          rotation={this.activeBlock === item.key && this.wiggle}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});

SortableGrid.propTypes = {
  order: arrayOf(string).isRequired,
  data: arrayOf(shape({ key: string })).isRequired,
  rowHeight: number,
  columns: number,
  activationThreshold: number,
  transitionDuration: number,
  style: object,
  renderItem: func.isRequired,
  onGrantBlock: func,
  onMoveBlock: func,
  onReleaseBlock: func,
  onActivateDrag: func,
  onDeactivateDrag: func,
};

SortableGrid.defaultProps = {
  rowHeight: 50,
  columns: 4,
  activationThreshold: 100,
  transitionDuration: 200,
  style: {},
  onGrantBlock: () => {},
  onMoveBlock: () => {},
  onReleaseBlock: () => {},
  onActivateDrag: () => {},
  onDeactivateDrag: () => {},
};

export default SortableGrid;
