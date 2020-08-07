/* eslint-disable eqeqeq */
import React, { Component } from 'react';
import { Animated, TouchableWithoutFeedback, PanResponder, View, ScrollView } from 'react-native';
import { sortBy, noop, clamp } from 'lodash';
import { styles } from './styles';
import { animateTiming, animateSpring, getDistance } from './utils';
import { SortableGridDefaultProps, SortableGridPropTypes } from './types';

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

  // scrollable properties
  activeBlockOffset = null;
  scrollView = React.createRef();
  containerHeight = 0;
  scrollOffset = { x: 0, y: 0 };
  keepScrolling = null;

  // wiggle
  startDragWiggle = new Animated.Value(0);

  constructor() {
    super();
  }

  UNSAFE_componentWillUpdate = (nextProps) => {
    console.log('will update');
    this.gridHeight = nextProps.blockHeight * Math.ceil(nextProps.children.length / nextProps.columns);
    this.blockWidth = (this.blockWidth * this.props.columns) / nextProps.columns;

    const oldBlockPositions = Object.keys(this.blockPositions);
    oldBlockPositions.forEach(
      key => !nextProps.children.find(child => child.key == key) && delete this.blockPositions[key],
    );

    this.itemOrder = {};
    nextProps.order.forEach((key, index) => {
      this.itemOrder[key] = { key, order: index };
      const x = (index % nextProps.columns) * this.blockWidth;
      const y = Math.floor(index / nextProps.columns) * nextProps.blockHeight;

      if (!this.blockPositions[key]) {
        this.blockPositions[key] = {
          currentPosition: new Animated.ValueXY({ x, y }),
          origin: { x, y },
        };
      } else {
        this.getBlock(key).origin = { x, y };
        this.getBlock(key).currentPosition.setValue({ x, y });
      }
    });
  };

  onGrantBlock = (evt, gestureState) => {
    const activeBlockPosition = this.getActiveBlock().origin;
    const x = activeBlockPosition.x - gestureState.x0;
    const y = activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y;
    this.activeBlockOffset = { x, y };
  };

  onMoveBlock = (evt, gestureState) => {
    let dragPosition = {
      x: gestureState.moveX + this.activeBlockOffset.x,
      y: gestureState.moveY + this.activeBlockOffset.y,
    };
    const activeBlock = this.getActiveBlock();
    const originalPosition = activeBlock.origin;

    const scrollThreshold = this.props.blockHeight / 5;
    const scrollUp = dragPosition.y < scrollThreshold && this.scrollOffset.y > 0;
    const scrollDown =
      dragPosition.y > this.containerLayout.height - this.containerLayout.y - scrollThreshold &&
      dragPosition.y + this.scrollOffset.y + scrollThreshold < this.gridHeight;

    const scrollBy = (scrollUp * -1 + scrollDown * 1) * this.props.blockHeight;

    const clampX = x => clamp(x, 0, this.gridWidth - this.blockWidth);
    const clampY = y => clamp(y, 0, this.gridHeight - this.props.blockHeight);

    if (!scrollDown && !scrollUp) {
      const actualDragPosition = {
        x: clampX(dragPosition.x),
        y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
      };
      activeBlock.currentPosition.setValue(actualDragPosition);
      this.moveBlock(originalPosition, actualDragPosition);
      this.keepScrolling = clearInterval(this.keepScrolling);
    } else {
      const actualDragPosition = {
        x: clampX(dragPosition.x),
        y: clampY(dragPosition.y + this.scrollOffset.y),
      };
      activeBlock.currentPosition.setValue(actualDragPosition);
      this.moveBlock(originalPosition, actualDragPosition);
      this.keepScrolling = clearInterval(this.keepScrolling);
      this.keepScrolling = setInterval(() => {
        const activeBlock = this.getActiveBlock();
        const originalPosition = activeBlock.origin;
        const actualDragPosition = {
          x: clampX(dragPosition.x),
          y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
        };
        this.scrollView.current.scrollTo({ y: this.scrollOffset.y + scrollBy });
        activeBlock.currentPosition.setValue(actualDragPosition);
        this.moveBlock(originalPosition, actualDragPosition);
      }, 250);
    }
  };

  moveBlock = (originalPosition, currentPosition) => {
    const activeBlock = this.getActiveBlock();
    let closest = this.activeBlock;
    let closestDistance = getDistance(currentPosition, originalPosition);

    // find closest block
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

    //swap block positions
    const closestBlock = this.getBlock(closest);
    animateTiming(closestBlock.currentPosition, activeBlock.origin);
    activeBlock.origin = closestBlock.origin;
    closestBlock.origin = originalPosition;

    //swap item orders
    const tempOrder = this.itemOrder[this.activeBlock].order;
    this.itemOrder[this.activeBlock].order = this.itemOrder[closest].order;
    this.itemOrder[closest].order = tempOrder;
  };

  onReleaseBlock = () => {
    this.keepScrolling = clearInterval(this.keepScrolling);
    this.deactivateDrag();
  };

  deactivateDrag = () => {
    this.panCapture = false;

    Animated.timing(this.getActiveBlock().currentPosition,
      { toValue: this.getActiveBlock().origin,   duration: this.props.transitionDuration, useNativeDriver: true,
    }).start(({ finished }) => {
      const itemOrder = sortBy(this.itemOrder, item => item.order).map(item => item.key);
      this.props.onDragRelease(itemOrder);
      this.activeBlock = null;
      this.forceUpdate();
    });
  };

  activateDrag = key => () => {
    this.panCapture = true;
    animateSpring(this.startDragWiggle, 10, 0);
    
    this.activeBlock = key;
    this.forceUpdate();
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
    styles.sortableGrid,
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

  onScrollLayout = ({ nativeEvent }) => {
    this.containerLayout = nativeEvent.layout;
  };

  onScroll = ({ nativeEvent }) => {
    this.scrollOffset.x = nativeEvent.contentOffset.x;
    this.scrollOffset.y = nativeEvent.contentOffset.y;
  };

  renderEntry = item => (
    <Animated.View key={item.key} style={this.getBlockStyle(item.key)} {...this.panResponder.panHandlers}>
      <TouchableWithoutFeedback
        style={styles.container}
        delayLongPress={this.props.activationTreshold}
        onLongPress={item.inactive ? noop : this.activateDrag(item.key)}
      >
        <View style={styles.itemImageContainer}>
          <View style={styles.container}>{item}</View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );

  render = () => (
    <ScrollView
      ref={this.scrollView}
      scrollEnabled={!this.panCapture}
      onLayout={this.onScrollLayout}
      onScroll={this.onScroll}
      showsVerticalScrollIndicator={false}
      canCancelContentTouches={false}
      style={this.props.style}
    >
      <Animated.View style={this.getGridStyle()} onLayout={this.onGridLayout}>
        {this.props.children.map(this.renderEntry)}
      </Animated.View>
    </ScrollView>
  );
}

SortableGrid.propTypes = SortableGridPropTypes;
SortableGrid.defaultProps = SortableGridDefaultProps;

module.exports = SortableGrid;
