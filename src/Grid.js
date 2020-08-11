/* eslint-disable eqeqeq */
import React, { Component } from 'react';
import { Animated, TouchableWithoutFeedback, PanResponder, View, ScrollView } from 'react-native';
import { sortBy, noop, clamp } from 'lodash';
import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';
import { animateTiming, animateSpring, getDistance } from './utils';
import { StyleSheet } from 'react-native';
import Cell from './Cell';

class SortableGrid extends Component {
  itemOrder = {};
  blockPositions = {};
  activeBlock = null;
  gridHeight = 0;
  gridWidth = 0;
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

  activeBlockOffset = null;

  startDragWiggle = new Animated.Value(0);

  UNSAFE_componentWillUpdate = (nextProps) => {
    this.gridHeight = nextProps.blockHeight * Math.ceil(nextProps.children.length / nextProps.columns);
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
        toBeAnimated.push(animateTiming(this.getBlock(key).currentPosition, blockPosition, this.props.transitionDuration * 4));
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
    const originalPosition = activeBlock.origin;
    const currentPosition = activeBlock.currentPosition;

    const actualDragPosition = {
      x: clamp(dragPosition.x, 0, this.gridWidth - this.blockWidth),
      y: clamp(dragPosition.y, 0, this.gridHeight - this.props.blockHeight),
    };
    currentPosition.setValue(actualDragPosition);
    this.moveBlock(originalPosition, actualDragPosition);
  };

  onReleaseBlock = (evt, gestureState) => {
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    this.panCapture = false;

    const activeBlock = this.getActiveBlock();
    const currentPosition = activeBlock.currentPosition;
    const originalPosition = activeBlock.origin;

    animateTiming(currentPosition, originalPosition, this.props.transitionDuration, () => {
      const itemOrder = sortBy(this.itemOrder, item => item.order).map(item => item.key);
      this.props.onDragRelease(itemOrder);
      this.activeBlock = null;
      this.forceUpdate();
    });  
  };

  activateDrag = key => () => {
    const override = this.props.activateDrag(this);
    if (override) {
      return;
    }
    this.panCapture = true;
    animateSpring(this.startDragWiggle, 10, 0, () => {});
    
    this.activeBlock = key;
    this.forceUpdate();
  };

  moveBlock = (originalPosition, currentPosition) => {
    const activeBlock = this.getActiveBlock();
    let closest = this.activeBlock;
    let closestDistance = getDistance(currentPosition, originalPosition);

    for (let key in this.blockPositions) {
      const block = this.blockPositions[key];
      const blockPosition = block.origin;
      const distance = getDistance(currentPosition, blockPosition);
      if (distance < closestDistance && distance < this.blockWidth) {
        closest = key;
        closestDistance = distance;
      }
    }

    if (closest == this.activeBlock) {
      return;
    }

    const closestBlock = this.getBlock(closest);
    animateTiming(closestBlock.currentPosition, activeBlock.origin);
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
    this.gridWidth = nativeEvent.layout.width;
    this.blockWidth = nativeEvent.layout.width / this.props.columns;
    this.forceUpdate();
  };

  getGridStyle = () => [
    styles.grid,
    this.blockPositionsSet() && { height: this.gridHeight + this.props.blockHeight },
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
