import React, { PureComponent } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { animateTiming, animateWiggle, noop, clamp } from './utils';
import Cell from './Cell';

class SortableGrid extends PureComponent {
  keyToOrder = {};
  keysByOrder = {};
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
  activeBlockKey = null;
  activationAnim = new Animated.Value(0);

  getTargetXY = (orderIndex, columns, blockWidth, rowHeight) => ({
    x: (orderIndex % columns) * blockWidth,
    y: Math.floor(orderIndex / columns) * rowHeight,
  });

  UNSAFE_componentWillUpdate = ({ rowHeight, columns, data, order }) => {
    this.layout.height = rowHeight * Math.ceil(data.length / columns);
    this.blockWidth = this.layout.width / columns;

    const nextKeys = new Set();
    for (let i = 0; i < data.length; i += 1) {
      nextKeys.add(data[i].key);
    }
    for (const key in this.blockPositions) {
      if (!nextKeys.has(key)) {
        this.blockPositions[key]?.stopAnimation();
        delete this.blockPositions[key];
      }
    }

    const previousKeyToOrder = this.keyToOrder;
    this.keyToOrder = {};
    this.keysByOrder = order.slice();
    const animations = [];
    const dimensionsChanged = columns !== this.props.columns || rowHeight !== this.props.rowHeight;


    for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
      const key = order[orderIndex];
      const oldOrderIndex = previousKeyToOrder[key];
      this.keyToOrder[key] = orderIndex;
      const blockPosition = this.getTargetXY(orderIndex, columns, this.blockWidth, rowHeight);
      if (this.blockPositions[key]) {
        if (oldOrderIndex !== orderIndex) {
          if (key !== this.activeBlockKey) {
            animations.push(
              Animated.timing(this.blockPositions[key], {
                toValue: blockPosition,
                duration: 0,
                useNativeDriver: true,
              })
            );
          } else {
            this.getBlock(key).setValue(blockPosition);
          }
        }
      } else {
        this.blockPositions[key] = new Animated.ValueXY(blockPosition);
      }
    }
    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  };

  onGrantBlock = (evt, gestureState) => {
    const override = this.props.onGrantBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    
    const activeBlockOrigin = this.getTargetXY(this.keyToOrder[this.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight);
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
    activeBlock.setValue(actualDragPosition);
    this.moveBlock(actualDragPosition);
  };

  onReleaseBlock = (evt, gestureState) => {
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    this.panCapture = false;
    const activeBlock = this.getActiveBlock();
    const currentPosition = activeBlock;
    const originalPosition = this.getTargetXY(this.keyToOrder[this.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight);
    if (activeBlock) animateTiming(currentPosition, originalPosition, this.props.transitionDuration, this.onDeactivateDrag);
  };

  onActivateDrag = (key) => {
    const override = this.props.onActivateDrag(key, this);
    if (override) {
      return;
    }
    this.panCapture = true;
    this.activeBlockKey = key;
    this.props.activationAnimation(this.activationAnim);
    this.forceUpdate();
  };

  onDeactivateDrag = () => {
    const override = this.props.onDeactivateDrag(this.keysByOrder, this);
    if (override) {
      return;
    }
    this.activeBlockKey = null;
  };

  moveBlock = (currentPosition) => {
    const row = clamp(Math.floor((currentPosition.y + this.props.rowHeight / 2) / this.props.rowHeight), 0, Math.ceil(this.keysByOrder.length / this.props.columns) - 1);
    const col = clamp(Math.floor((currentPosition.x + this.blockWidth / 2) / this.blockWidth), 0, this.props.columns - 1);
    const targetOrder = row * this.props.columns + col;
    const closest = this.keysByOrder[targetOrder];
    if (closest === this.activeBlockKey) {
      return;
    }
    const closestBlock = this.getBlock(closest);
    if (closestBlock) animateTiming(closestBlock, this.getTargetXY(this.keyToOrder[this.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight), this.props.transitionDuration);

    [
      this.keyToOrder[this.activeBlockKey],
      this.keyToOrder[closest]
    ] = [
      this.keyToOrder[closest],
      this.keyToOrder[this.activeBlockKey]
    ];
    [
      this.keysByOrder[this.keyToOrder[this.activeBlockKey]],
      this.keysByOrder[this.keyToOrder[closest]]
    ] = [
      this.keysByOrder[this.keyToOrder[closest]],
      this.keysByOrder[this.keyToOrder[this.activeBlockKey]]
    ];
  };

  getActiveBlock = () => this.blockPositions[this.activeBlockKey];

  getBlock = (key) => this.blockPositions[key];

  blockPositionsSet = () => this.keysByOrder.length === this.props.order.length;

  onLayout = ({ nativeEvent }) => {
    this.layout.width = nativeEvent.layout.width;
    this.blockWidth = nativeEvent.layout.width / this.props.columns;
    this.forceUpdate();
  };

  getStyle = () => [
    styles.grid,
    this.blockPositionsSet() && { height: this.layout.height + this.props.rowHeight },
  ];

  render = () => (
    <View style={this.getStyle()} onLayout={this.onLayout} {...this.panResponder.panHandlers}>
      {this.props.data.map((item) => (
        <Cell
          key={item.key}
          item={item}
          onActivate={this.onActivateDrag}
          renderItem={this.props.renderItem}
          height={this.props.rowHeight}
          width={this.blockWidth}
          active={this.activeBlockKey === item.key}
          position={this.blockPositionsSet() && this.blockPositions[item.key]}
          activeBlockStyle={this.activeBlockKey === item.key ? (this.props.activeBlockStyle || { transform: [{ rotate: this.activationAnim.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) }] }) : null}
        />
      ))}
    </View>
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

SortableGrid.defaultProps = {
  rowHeight: 50,
  columns: 4,
  activationThreshold: 100,
  transitionDuration: 200,
  onGrantBlock: noop,
  onMoveBlock: noop,
  onReleaseBlock: noop,
  onActivateDrag: noop,
  onDeactivateDrag: noop,
  activationAnimation: (anim) => animateWiggle(anim, 10, 0, 200),
};

export default SortableGrid;
