import React, { PureComponent } from 'react';
import { Animated, PanResponder, StyleSheet, View, ScrollView } from 'react-native';
import { noop, clamp } from './utils';
import { Cell } from './Cell';

export class SortableGrid extends PureComponent {
  keyToOrder = {};
  orderToKey = {};
  cells = {};
  activeBlockOffset = { x: 0, y: 0 };
  _activeBlockKey = null; // NOTE: we are not guaranteed that state.activeBlockKey will be set before onGrantBlock gets called
  state = {
    activeBlockKey: null,
    blockWidth: 0,
  };
  layout = null;
  panCapture = false;
  panResponder = PanResponder.create({
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: () => this.panCapture,
    onMoveShouldSetPanResponderCapture: () => this.panCapture,
    onPanResponderGrant: (evt, gestureState) => this.onGrantBlock(evt, gestureState),
    onPanResponderMove: (evt, gestureState) => this.onMoveBlock(evt, gestureState),
    onPanResponderRelease: (evt, gestureState) => this.onReleaseBlock(evt, gestureState),
    onPanResponderTerminate: (evt, gestureState) => this.onReleaseBlock(evt, gestureState),
  });
  scrollView = React.createRef();
  scrollOffset = { x: 0, y: 0 };
  latestMove = { x: 0, y: 0 };
  keepScrolling = null;
  activationProgress = new Animated.Value(0);
  activationAnimation = null;

  getPositionByOrder = (orderIndex) => {
    const { columns, rowHeight } = this.props;
    const { blockWidth } = this.state;
    const x = (orderIndex % columns) * blockWidth;
    const y = Math.floor(orderIndex / columns) * rowHeight;
    if (Number.isNaN(x) || Number.isNaN(y)) return undefined;
    return ({ x, y });
  };

  getPositionByKey = (key) => this.getPositionByOrder(this.keyToOrder[key]);

  componentDidUpdate(prevProps) {
    const { rowHeight, columns, items, order } = this.props;
    if (columns !== prevProps.columns || rowHeight !== prevProps.rowHeight) {
      this.layout.height = rowHeight * Math.ceil(items.length / columns);
      this.setState({ blockWidth: Math.floor(this.layout.width / columns) });
      return;
    }
    for (let i = 0; i < order.length; i += 1) {
      const key = order[i];
      if (this.keyToOrder[key] === i) continue;
      this.keyToOrder[key] = i;
      this.orderToKey[i] = key;
      const position = this.getPositionByOrder(i);
      if (position && this.cells[key]) {
        this.cells[key].stopAnimation();
        this.cells[key].runAnimation({ position });
      }
    }
  }

  onActivateDrag = (key) => {
    const override = this.props.onActivateDrag(key, this);
    if (override) return;
    this.panCapture = true;
    this.setState({ activeBlockKey: key });
    this._activeBlockKey = key;
    this.runAnimation();
  };

  onGrantBlock = (evt, gestureState) => {
    const override = this.props.onGrantBlock(evt, gestureState, this);
    if (override) return;
    this.panCapture = true;
    const activeBlockPosition = this.getPositionByKey(this._activeBlockKey);
    this.activeBlockOffset = {
      x: activeBlockPosition.x - gestureState.x0,
      y: activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y,
    };
    this.latestMove = { x: gestureState.x0, y: gestureState.y0 };
  };

  onMoveBlock = (evt, gestureState) => {
    const override = this.props.onMoveBlock(evt, gestureState, this);
    if (override) return;
    const actualDragPosition = {
      x: clamp(this.activeBlockOffset.x + gestureState.moveX, 0, this.layout.width - this.state.blockWidth),
      y: clamp(this.activeBlockOffset.y + gestureState.moveY + this.scrollOffset.y, 0, this.layout.height - this.props.rowHeight),
    };
    this.latestMove = { x: gestureState.moveX, y: gestureState.moveY };
    this.cells[this._activeBlockKey].position.setValue(actualDragPosition);
    this.moveBlock(actualDragPosition);
    if (!this.keepScrolling) {
      this.runAutoScroll();
    }
  };

  onReleaseBlock = (evt, gestureState) => {
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) return;
    this.stopAutoScroll();
    this.panCapture = false;
    const position = this.getPositionByKey(this._activeBlockKey);
    this.cells[this._activeBlockKey]?.runAnimation({ position, cb: this.onDeactivateDrag, duration: this.props.transitionDuration });
  };

  onDeactivateDrag = () => {
    const order = Object.entries(this.keyToOrder).sort((a, b) => a[1] - b[1]).map((entry) => entry[0]);
    const override = this.props.onDeactivateDrag(order, this);
    if (override) return;
    this._activeBlockKey = null;
    this.setState({ activeBlockKey: null });
    this.stopAnimation();
  };

  moveBlock = (currentPosition) => {
    const { items, rowHeight, columns, pinned } = this.props;
    const { blockWidth } = this.state;
    const row = clamp(Math.round(currentPosition.y / rowHeight), 0, Math.ceil(items.length / columns) - 1);
    const col = clamp(Math.round(currentPosition.x / blockWidth), 0, columns - 1);
    const targetOrder = row * columns + col;
    const closest = this.orderToKey[targetOrder];
    if (typeof closest === 'undefined' || closest === this._activeBlockKey || pinned.has(closest)) return;
    const position = this.getPositionByKey(this._activeBlockKey);
    this.cells[closest].runAnimation({ position, duration: this.props.transitionDuration });
    const [ aKey, bKey ] = [ this._activeBlockKey, closest ];
    [ this.keyToOrder[aKey], this.keyToOrder[bKey] ] = [ this.keyToOrder[bKey], this.keyToOrder[aKey] ];
    const [ aOrder, bOrder ] = [ this.keyToOrder[aKey], this.keyToOrder[bKey] ];
    [ this.orderToKey[aOrder], this.orderToKey[bOrder] ] = [ this.orderToKey[bOrder], this.orderToKey[aOrder] ];
  };

  onLayout = ({ nativeEvent }) => {
    this.layout = nativeEvent.layout;
    this.setState({ blockWidth: Math.floor(nativeEvent.layout.width / this.props.columns) });
  };

  onScroll = ({ nativeEvent }) => {
    this.scrollOffset = nativeEvent.contentOffset;
    if (!this.panCapture || this._activeBlockKey === null) return;
    const actualDragPosition = {
      x: clamp(this.latestMove.x + this.activeBlockOffset.x, 0, this.layout.width - this.state.blockWidth),
      y: clamp(this.latestMove.y + this.activeBlockOffset.y + this.scrollOffset.y, 0, this.layout.height - this.props.rowHeight),
    };
    this.cells[this._activeBlockKey].position.setValue(actualDragPosition);
    this.moveBlock(actualDragPosition);
    if (!this.keepScrolling) {
      this.runAutoScroll();
    }
  };

  runAutoScroll = () => {
    if (!this.panCapture || !this.layout) {
      this.stopAutoScroll();
      return;
    }
    const relY = this.latestMove.y - (this.layout.y);
    const scrollUp = relY < this.props.rowHeight && this.scrollOffset.y > 0;
    const scrollDown = relY > (this.viewPortHeight - this.props.rowHeight) && (this.scrollOffset.y + this.viewPortHeight) < this.layout?.height;
    // @ts-ignore
    const scrollBy = (scrollUp * -1 + scrollDown * 1) * this.props.scrollStep; 
    if (scrollBy !== 0) {
      this.scrollView.current.scrollTo({ y: this.scrollOffset.y + scrollBy, animated: false });
      this.keepScrolling = requestAnimationFrame(this.runAutoScroll);
    } else {
      this.stopAutoScroll();
    }
  };
    
  stopAutoScroll = () => {
    cancelAnimationFrame(this.keepScrolling);
    this.keepScrolling = null;
  };

  runAnimation() {
    this.activationAnimation = this.props.animateActiveStyle(this.activationProgress, this);
  }

  stopAnimation() {
    if (this.activationAnimation) cancelAnimationFrame(this.activationAnimation);
    if (this.activationProgress && this.activationProgress.resetAnimation) this.activationProgress.resetAnimation();
  }

  componentWillUnmount() {
    this.stopAnimation();
    this.stopAutoScroll();
  }

  onScrollViewLayout = ({ nativeEvent }) => {
    this.viewPortHeight = nativeEvent.layout.height;
  };

  render() {
    const { items, columns, rowHeight } = this.props;
    const gridStyle = [ styles.grid, { height: Math.ceil(items.length / columns) * rowHeight } ];
    return (
      <ScrollView
        ref={this.scrollView}
        onLayout={this.onScrollViewLayout} 
        onScroll={this.onScroll}
        scrollEnabled={!this.panCapture}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        <View style={gridStyle} onLayout={this.onLayout} { ...this.panResponder.panHandlers }>
          {this.state.blockWidth ? items.map((item) => (
            <Cell
              ref={(el) => { this.cells[item.key] = el; }}
              key={item.key}
              item={item}
              onActivate={this.onActivateDrag}
              renderItem={this.props.renderItem}
              rowHeight={this.props.rowHeight}
              active={this.state.activeBlockKey === item.key}
              getActiveStyle={this.props.getActiveStyle}
              activationProgress={this.activationProgress}
              columns={this.props.columns}
              blockWidth={this.state.blockWidth}
              grid={this}
              activationThreshold={this.props.activationThreshold}
            />
        )) : null}
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
    width: '100%',
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
  getActiveStyle: (animation) => ({
    transform: [ { rotate: animation.interpolate({ inputRange: [0, 360], outputRange: ['0deg', '360deg'] }) } ],
    elevation: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
  }),
  animateActiveStyle: (animation) => requestAnimationFrame(() => {
    animation.setValue(10);
    Animated.spring(animation, { toValue: 0, velocity: 2000, tension: 2000, friction: 5, useNativeDriver: true }).start();
  }),
  scrollStep: 15,
  pinned: new Set(),
};
