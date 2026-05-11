import React, { PureComponent } from 'react';
import { Animated, PanResponder, StyleSheet, View, ScrollView } from 'react-native';
import { noop, clamp } from './utils';
import Cell from './Cell';

class SortableGrid extends PureComponent {
  keyToOrder = {};
  orderToKey = {};

  cells = {};

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
  activeBlockOffset = { x: 0, y: 0 };

  //from scrollable
  scrollView = React.createRef();
  scrollOffset = { x: 0, y: 0 };

  latestMove = { x: 0, y: 0 };;

  autoScrollTimer = null;
  // end from scrollable

  activation = new Animated.Value(0);
  animations = [];

  state = {
    activeBlockKey: null,
    blockWidth: 0,
  };

  layout = null;

  _activeBlockKey = null;

  getTargetXY = (orderIndex, columns, blockWidth, rowHeight) => ({
    x: (orderIndex % columns) * blockWidth,
    y: Math.floor(orderIndex / columns) * rowHeight,
  });

  componentDidUpdate(prevProps, prevState) {
    console.log('didUpdate')

    const { rowHeight, columns } = this.props;
    if (this.props.columns !== prevProps.columns || this.props.rowHeight !== prevProps.rowHeight) {
      this.layout.height = this.props.rowHeight * Math.ceil(this.props.data.length / this.props.columns);
      this.setState({ blockWidth: Math.floor(this.layout.width / this.props.columns) });
      return;
    }

    const animations = [];


    for (let i = 0; i < this.props.order.length; i += 1) {
      const key = this.props.order[i];
      const order = i;
      if (this.keyToOrder[key] !== order) {
        this.keyToOrder[key] = order;
        this.orderToKey[order] = key;
        const blockPosition = this.getTargetXY(order, columns, this.state.blockWidth, rowHeight);
        if (this.cells[key]?.position) {
          animations.push(
            Animated.timing(this.cells[key].position, {
              toValue: blockPosition,
              duration: 0,
              useNativeDriver: true,
            })
          );
        }

      }
    }
    if (animations.length > 0) {
      Animated.parallel(animations).start();
    }
  }

  onActivateDrag = (key) => {
    const override = this.props.onActivateDrag(key, this);
    if (override) return;
    this.panCapture = true;
    this.setState({ activeBlockKey: key }); // NOTE: we are not guaranteed that state.activeBlockKey will be set before onGrantBlock gets called
    this._activeBlockKey = key;
    this.props.activeAnimation(this.activation, this);
  };

  onGrantBlock = (evt, gestureState) => {
    const override = this.props.onGrantBlock(evt, gestureState, this);
    if (override) return;
    this.panCapture = true;
    const activeBlockPosition = this.getTargetXY(this.keyToOrder[this._activeBlockKey], this.props.columns, this.state.blockWidth, this.props.rowHeight);
    this.activeBlockOffset = {
      x: activeBlockPosition.x - gestureState.x0,
      y: activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y,
    };
    this.latestMove = { x: gestureState.x0, y: gestureState.y0 };
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
      x: clamp(dragPosition.x, 0, this.layout.width - this.state.blockWidth),
      y: clamp(dragPosition.y, 0, this.layout.height - this.props.rowHeight),
    };
    this.latestMove = { x: gestureState.moveX, y: gestureState.moveY };

    this.cells[this._activeBlockKey].position.setValue(actualDragPosition);

    this.moveBlock(actualDragPosition);

    if (!this.autoScrollTimer) {
      this.handleAutoScroll();
    }
  };

  onReleaseBlock = (evt, gestureState) => {
    const override = this.props.onReleaseBlock(evt, gestureState, this);
    if (override) return;
  // from scrollable
    this.stopAutoScroll();
    //
  // end from scrollable

    this.panCapture = false;
    const activeBlock = this.cells[this._activeBlockKey].position;
    const currentPosition = activeBlock;
    const originalPosition = this.getTargetXY(this.keyToOrder[this._activeBlockKey], this.props.columns, this.state.blockWidth, this.props.rowHeight);
    if (activeBlock) Animated.timing(currentPosition, {
      toValue: originalPosition,
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start(this.onDeactivateDrag);
  };

  onDeactivateDrag = () => {
    const order = Object.entries(this.keyToOrder).sort((a, b) => a[1] - b[1]).map((entry) => entry[0]);
    const override = this.props.onDeactivateDrag(order, this);
    if (override) return;
    this._activeBlockKey = null;
    this.setState({ activeBlockKey: null });
  };

  moveBlock = (currentPosition) => {
    const { data, rowHeight, columns } = this.props;
    const { blockWidth } = this.state;
    const activeBlockKey = this._activeBlockKey;

    const row = clamp(Math.floor((currentPosition.y + rowHeight / 2) / rowHeight), 0, Math.ceil(data.length / columns) - 1);
    const col = clamp(Math.floor((currentPosition.x + blockWidth / 2) / blockWidth), 0, columns - 1);
    const targetOrder = row * columns + col;
    const closest = this.orderToKey[targetOrder];
    if (typeof closest === 'undefined') return;
    if (closest === activeBlockKey) {
      return;
    }
    
    const closestBlock = this.cells[closest].position;
    Animated.timing(closestBlock, {
      toValue: this.getTargetXY(this.keyToOrder[activeBlockKey], columns, blockWidth, rowHeight),
      duration: this.props.transitionDuration,
      useNativeDriver: true,
    }).start();
    const [ aKey, bKey ] = [ activeBlockKey, closest ];
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
    const activeBlockKey = this._activeBlockKey;

    if (this.panCapture && activeBlockKey !== null) {
      const dragPosition = {
        x: this.latestMove.x + this.activeBlockOffset.x,
        y: this.latestMove.y + this.activeBlockOffset.y + this.scrollOffset.y,
      };

      const actualDragPosition = {
        x: clamp(dragPosition.x, 0, this.layout.width - this.state.blockWidth),
        y: clamp(dragPosition.y, 0, this.layout.height - this.props.rowHeight),
      };

      this.cells[activeBlockKey].position.setValue(actualDragPosition);
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
    const relY = this.latestMove.y - (this.layout.y);
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

    const gridStyle = [ styles.grid, { height: Math.ceil(data.length / columns) * rowHeight } ];

    return (
      <ScrollView
        ref={this.scrollView}
        onLayout={(e) => { this.viewPortHeight = e.nativeEvent.layout.height; }} 
        onScroll={this.onScroll}
        scrollEnabled={!this.panCapture}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
      >
        <View style={gridStyle} onLayout={this.onLayout} {...this.panResponder.panHandlers}>
          {this.state.blockWidth ? data.map((item) => (
              <Cell
                ref={(el) => (this.cells[item.key] = el)}
                key={item.key}
                item={item}
                onActivate={this.onActivateDrag}
                renderItem={this.props.renderItem}
                rowHeight={this.props.rowHeight}
                active={this.state.activeBlockKey === item.key}
                activeStyle={this.props.activeStyle}
                activation={this.activation}
                columns={this.props.columns}
                blockWidth={this.state.blockWidth}
                grid={this}
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
  onCancelBlock: noop,
  activeStyle: (animation) => ({
    transform: [ { rotate: animation.interpolate({ inputRange: [0, 360], outputRange: [ '0deg', '360deg' ] }) } ],
    elevation: animation.interpolate({ inputRange: [0, 1], outputRange: [0, 10] }),
  }),
  activeAnimation: (animation) => {
    requestAnimationFrame(() => {
      animation.setValue(10);
      Animated.spring(animation, {
        toValue: 0,
        velocity: 2000,
        tension: 2000,
        friction: 5,
        useNativeDriver: true,
      }).start();
    });

  }
};

export default SortableGrid;
