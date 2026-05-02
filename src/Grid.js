import React, { PureComponent } from 'react';
import { Animated, PanResponder, StyleSheet, View, ScrollView } from 'react-native';
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

  //from scrollable
  scrollView = React.createRef();
  scrollOffset = { x: 0, y: 0 };

  latestMoveX = 0;
  latestMoveY = 0;

  autoScrollTimer = null;
  // end from scrollable

  cells = {};
  activation = new Animated.Value(0);
  animations = [];

  state = {
    layoutReady: false,
    activeBlockKey: null,
  };

  getTargetXY = (orderIndex, columns, blockWidth, rowHeight) => ({
    x: (orderIndex % columns) * blockWidth,
    y: Math.floor(orderIndex / columns) * rowHeight,
  });

  componentDidUpdate(prevProps, prevState) {
    console.log('did update');
    const { rowHeight, columns, data, order } = this.props;
    this.layout.height = rowHeight * Math.ceil(data.length / columns);
    this.blockWidth = Math.floor(this.layout.width / columns);
    const layoutChanged = rowHeight !== prevProps.rowHeight || columns !== prevProps.columns;

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
    console.log({ layoutChanged })
    for (let orderIndex = 0; orderIndex < order.length; orderIndex += 1) {
      const key = order[orderIndex];
      const oldOrderIndex = previousKeyToOrder[key];
      this.keyToOrder[key] = orderIndex;
      const blockPosition = this.getTargetXY(orderIndex, columns, this.blockWidth, rowHeight);
      if (this.blockPositions[key]) {
        if (layoutChanged) {
          
          animations.push(
            Animated.timing(this.blockPositions[key], {
              toValue: blockPosition,
              duration: 0,
              useNativeDriver: true,
            })
          );
        } else if (oldOrderIndex !== orderIndex) {
          if (key !== this.state.activeBlockKey) {
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
  }

  onGrantBlock = (evt, gestureState) => {
    const override = this.props.onGrantBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    this.panCapture = true;
    const activeBlockPosition = this.getTargetXY(this.keyToOrder[this.state.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight);
    this.activeBlockOffset = {
      x: activeBlockPosition.x - gestureState.x0,
      y: activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y,
    };
    this.latestMoveX = gestureState.x0;
    this.latestMoveY = gestureState.y0;
  };

  onMoveBlock = (evt, gestureState) => {
    const override = this.props.onMoveBlock(evt, gestureState, this);
    if (override) {
      return;
    }
    const dragPosition = {
      x: this.activeBlockOffset.x + gestureState.moveX,
      y: this.activeBlockOffset.y + gestureState.moveY + this.scrollOffset.y,
    };
    const actualDragPosition = {
      x: clamp(dragPosition.x, 0, this.layout.width - this.blockWidth),
      y: clamp(dragPosition.y, 0, this.layout.height - this.props.rowHeight),
    };
    this.latestMoveX = gestureState.moveX;
    this.latestMoveY = gestureState.moveY;
    this.getActiveBlock().setValue(actualDragPosition);
    this.moveBlock(actualDragPosition);

    if (!this.autoScrollTimer) {
      this.handleAutoScroll();
    }
  };

  onReleaseBlock = (evt, gestureState) => {
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) {
      return;
    }
  // from scrollable
    this.stopAutoScroll();
    //
  // end from scrollable

    this.panCapture = false;
    const activeBlock = this.getActiveBlock();
    const currentPosition = activeBlock;
    const originalPosition = this.getTargetXY(this.keyToOrder[this.state.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight);
    if (activeBlock) Animated.timing(currentPosition, {
      toValue: originalPosition,
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start(this.onDeactivateDrag);
  };

  onActivateDrag = (key) => {
    const override = this.props.onActivateDrag(key, this);
    if (override) {
      return;
    }
    this.panCapture = true;
    animateWiggle(this.activation, 10, 0, 200);
    this.setState({ activeBlockKey: key });
  };

  onDeactivateDrag = () => {
    const override = this.props.onDeactivateDrag(this.keysByOrder, this);
    if (override) {
      return;
    }
    this.setState({ activeBlockKey: null });
  };

  moveBlock = (currentPosition) => {
    const row = clamp(Math.floor((currentPosition.y + this.props.rowHeight / 2) / this.props.rowHeight), 0, Math.ceil(this.keysByOrder.length / this.props.columns) - 1);
    const col = clamp(Math.floor((currentPosition.x + this.blockWidth / 2) / this.blockWidth), 0, this.props.columns - 1);
    const targetOrder = row * this.props.columns + col;
    const closest = this.keysByOrder[targetOrder];
    if (closest === this.state.activeBlockKey) {
      return;
    }
    const closestBlock = this.getBlock(closest);
    if (closestBlock) 
      Animated.timing(closestBlock, {
      toValue: this.getTargetXY(this.keyToOrder[this.state.activeBlockKey], this.props.columns, this.blockWidth, this.props.rowHeight),
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start();
    [
      this.keyToOrder[this.state.activeBlockKey],
      this.keyToOrder[closest]
    ] = [
      this.keyToOrder[closest],
      this.keyToOrder[this.state.activeBlockKey]
    ];
    [
      this.keysByOrder[this.keyToOrder[this.state.activeBlockKey]],
      this.keysByOrder[this.keyToOrder[closest]]
    ] = [
      this.keysByOrder[this.keyToOrder[closest]],
      this.keysByOrder[this.keyToOrder[this.state.activeBlockKey]]
    ];
  };

  getActiveBlock = () => this.blockPositions[this.state.activeBlockKey];

  getBlock = (key) => this.blockPositions[key];

  onLayout = ({ nativeEvent }) => {
    const { width, height } = nativeEvent.layout;

    this.layout.width = width;
    this.layout.height = height;
    this.blockWidth = width / this.props.columns;

    this.props.data.forEach((item, index) => {
      const key = item.key;
      const orderIndex = this.keyToOrder[key] ?? index;
      const pos = this.getTargetXY(orderIndex, this.props.columns, this.blockWidth, this.props.rowHeight);
      
      if (!this.blockPositions[key]) {
        this.blockPositions[key] = new Animated.ValueXY(pos);
      } else {
        this.blockPositions[key].setValue(pos);
      }
    });

    this.setState({ layoutReady: true });
  };

  onScroll = ({ nativeEvent }) => {
    this.scrollOffset = nativeEvent.contentOffset;

    if (this.panCapture && this.state.activeBlockKey) {
      const dragPosition = {
        x: this.latestMoveX + this.activeBlockOffset.x,
        y: this.latestMoveY + this.activeBlockOffset.y + this.scrollOffset.y,
      };

      const actualDragPosition = {
        x: clamp(dragPosition.x, 0, this.layout.width - this.blockWidth),
        y: clamp(dragPosition.y, 0, this.layout.height - this.props.rowHeight),
      };

      this.getActiveBlock().setValue(actualDragPosition);
      this.moveBlock(actualDragPosition);

      if (!this.autoScrollTimer) {
        this.handleAutoScroll();
      }
    }
  };

  handleAutoScroll = () => {
    if (!this.panCapture || !this.layout) {
      this.stopAutoScroll();
      return;
    }
    const relY = this.latestMoveY - (this.layout.y || 0);
    let diff = 0;
    if (relY < this.props.rowHeight && this.scrollOffset.y > 0) {
      diff = -15;
    } 
    else if (relY > this.viewPortHeight - this.props.rowHeight && (this.scrollOffset.y + this.viewPortHeight) < this.layout.height) {
      diff = 15;
    }
    if (diff !== 0) {
      this.scrollView.current.scrollTo({ y: this.scrollOffset.y + diff, animated: false });
      this.autoScrollTimer = requestAnimationFrame(this.handleAutoScroll);
    } else {
      this.stopAutoScroll();
    }
  };
    
  stopAutoScroll = () => {
    cancelAnimationFrame(this.autoScrollTimer);
    this.autoScrollTimer = null;
  };

  render = () => {
    console.log('grid');
    const { data, columns, rowHeight } = this.props;
    return (
      <ScrollView
        ref={this.scrollView}
        onLayout={(e) => { this.viewPortHeight = e.nativeEvent.layout.height; }} 
        onScroll={this.onScroll}
        scrollEnabled={!this.panCapture}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        scrollEventThrottle={16}
        removeClippedSubviews
      >
        <View style={[
    styles.grid,
    { height: Math.ceil(this.props.data.length / this.props.columns) * this.props.rowHeight + this.props.rowHeight },
  ]} onLayout={this.onLayout} {...this.panResponder.panHandlers}>
          {this.props.data.map((item) => {
            const key = item.key;
            if (!this.blockPositions[key]) {
              const orderIndex = this.keyToOrder[key];
              const pos = this.getTargetXY(orderIndex, columns, this.blockWidth, rowHeight);
              
              this.blockPositions[key] = new Animated.ValueXY(pos);
              this.keyToOrder[key] = orderIndex;
            }
            return (
              <Cell
                key={item.key}
                item={item}
                onActivate={this.onActivateDrag}
                renderItem={this.props.renderItem}
                height={this.props.rowHeight}
                active={this.state.activeBlockKey === item.key}
                position={this.blockPositions[item.key] ? this.blockPositions[item.key] : null}
                activeStyle={this.props.activeStyle}
                activation={this.activation}
                columns={this.props.columns}
              />
          )
  })}
        </View>
      </ScrollView>
    );
  }
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

const defaultActiveStyle = (animation) => ({
    transform: [ { rotate: animation.interpolate({ inputRange: [0, 360], outputRange: [ '0deg', '360deg' ] }) } ],
    elevation: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
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
  activeStyle: defaultActiveStyle ,
};

export default SortableGrid;
