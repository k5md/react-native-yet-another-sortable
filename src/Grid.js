/* eslint-disable eqeqeq */
import React, { Component } from 'react';
import { Animated, TouchableWithoutFeedback, PanResponder, View, ScrollView } from 'react-native';
import { sortBy, noop, clamp } from 'lodash';
import { StyleSheet } from 'react-native';
import Cell from './Cell';

class SortableGrid extends Component {
  itemOrder = {};
  blockPositions = {};
  activeBlock = null;
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

  startDragWiggle = new Animated.Value(0);

  UNSAFE_componentWillUpdate = (nextProps) => {
    this.layout.height = nextProps.blockHeight * Math.ceil(nextProps.children.length / nextProps.columns);
    this.blockWidth = (this.blockWidth * this.props.columns) / nextProps.columns;

    const oldBlockPositions = Object.keys(this.blockPositions);
    oldBlockPositions.forEach(
      key => !nextProps.children.find(child => child.key == key) && delete this.blockPositions[key],
    );

    this.itemOrder = {};

    const toBeAnimated = [];

    nextProps.order.forEach((key, index) => {
      this.itemOrder[key] = { key, order: index };
      const blockPosition = {
        x: (index % nextProps.columns) * this.blockWidth,
        y: Math.floor(index / nextProps.columns) * nextProps.blockHeight,
      };
    
      if (!this.blockPositions[key]) {
        this.blockPositions[key] = {
          currentPosition: new Animated.ValueXY(blockPosition),
          origin: blockPosition,
        };
      } else {
        this.getBlock(key).origin = blockPosition;
        // this.getBlock(key).currentPosition.setValue(blockPosition);
        toBeAnimated.push(
          Animated.timing(this.getBlock(key).currentPosition, {
            toValue: blockPosition,
            duration: this.props.transitionDuration * 2,
            useNativeDriver: true,
          }));
      }
    });
    Animated.parallel(toBeAnimated, { stopTogether: false }).start();
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
      y: clamp(dragPosition.y, 0, this.layout.height - this.props.blockHeight),
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

    Animated.timing(currentPosition, {
      toValue: originalPosition,
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start(() => {
      const itemOrder = sortBy(this.itemOrder, item => item.order).map(item => item.key);
      this.props.onDragRelease(itemOrder);
      this.activeBlock = null;
      this.forceUpdate();
    });
  };

  activateDrag = key => () => {
    this.panCapture = true;
    const override = this.props.activateDrag(this);
    if (override) {
      return;
    }
    

    this.startDragWiggle.setValue(10);
    Animated.spring(this.startDragWiggle, {
      toValue: 0,
      velocity: 2000,
      tension: 2000,
      friction: 5,
      useNativeDriver: true,
    }).start();
    
    this.activeBlock = key;
    this.forceUpdate();
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

    if (closest == this.activeBlock) {
      return;
    }

    const closestBlock = this.getBlock(closest);
    Animated.timing(closestBlock.currentPosition, {
      toValue: activeBlock.origin,
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start();
    activeBlock.origin = closestBlock.origin;
    closestBlock.origin = originalPosition;

    const tempOrder = this.itemOrder[this.activeBlock].order;
    this.itemOrder[this.activeBlock].order = this.itemOrder[closest].order;
    this.itemOrder[closest].order = tempOrder;
  };

  getActiveBlock = () => this.blockPositions[this.activeBlock];

  getBlock = key => this.blockPositions[key];

  blockPositionsSet = () => Object.keys(this.blockPositions).length == this.props.children.length;

  onGridLayout = ({ nativeEvent }) => {
    this.layout.width = nativeEvent.layout.width;
    this.blockWidth = nativeEvent.layout.width / this.props.columns;
    this.forceUpdate();
  };

  getGridStyle = () => [
    styles.grid,
    this.blockPositionsSet() && { height: this.layout.height + this.props.blockHeight },
  ];

  getBlockStyle = key => [
    {
      width: this.blockWidth,
      height: this.props.blockHeight,
      justifyContent: 'center',
    },
    this.blockPositionsSet() && {
      position: 'absolute',
      transform: [
        ...this.getBlock(key).currentPosition.getTranslateTransform(),
        {
          rotate:
            this.activeBlock == key
              ? this.startDragWiggle.interpolate({
                  inputRange: [0, 360],
                  outputRange: ['0 deg', '360 deg'],
                })
              : '0deg',
        },
      ],
    },
    this.activeBlock == key && { zIndex: 1 },
  ];

  render = () => (
    <Animated.View style={this.getGridStyle()} onLayout={this.onGridLayout} {...this.panResponder.panHandlers}>
      {this.props.children.map(item => <Cell
        key={item.key}
        item={item}
        style={this.getBlockStyle(item.key)}
        activateDrag={this.activateDrag(item.key)}
      />)}
    </Animated.View>
  );
}

module.exports = SortableGrid;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
