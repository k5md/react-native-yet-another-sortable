import React, { memo, PureComponent } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop } from './utils';

const getTargetXY = (orderIndex, columns, blockWidth, rowHeight) => ({
  x: (orderIndex % columns) * blockWidth,
  y: Math.floor(orderIndex / columns) * rowHeight,
});

export class Cell extends React.PureComponent {
  constructor(props) {
    console.log('cell constructor');
    super(props);
    const { grid, item: { key }, columns, rowHeight, blockWidth } = props;
    const order = grid.keyToOrder[key];
    const coords = getTargetXY(order, columns, blockWidth, rowHeight);
    this.position = new Animated.ValueXY(coords);
    grid.blockPositions[key] = this.position;
  }

  getStyle = ({ rowHeight, active, activation, activeStyle, blockWidth, grid }) => {
    const position = this.position;
    const style = {
      zIndex: active ? 1 : 0,
      height: rowHeight,
      width: blockWidth,
      transform: [],
    };
    if (position) style.transform = position.getTranslateTransform();
    if (active && activeStyle) {
      const { transform = [], ...rest } = activeStyle(activation);
      style.transform.push(...transform);
      return { ...style, ...rest };
    }
    return style;
  }

  componentDidUpdate(prevProps) {
    console.log('cell update');
    const { grid, columns, item: { key }, rowHeight, blockWidth } = this.props;
    if (blockWidth !== prevProps.blockWidth || rowHeight !== prevProps.rowHeight) {
      const order = grid.keyToOrder[key];
      const coords = getTargetXY(order, columns, blockWidth, rowHeight);
      Animated.timing(this.position, {
        toValue: coords,
        duration: 0,
        useNativeDriver: true,
      }).start();
    }
  }

  componentWillUnmount() {
    console.log('cell unmount');
    const { grid, item: { key } } = this.props;
    if (grid.blockPositions[key]) {
      grid.blockPositions[key]?.stopAnimation();
      delete grid.blockPositions[key];
      const order = grid.keyToOrder[key];
      delete grid.keyToOrder[key];
      delete grid.orderToKey[order];
      delete this.position;
    }
  }
  
  render() {
    const { item, onActivate, activationTreshold, renderItem } = this.props;
    return (
      <Animated.View style={[ styles.animatedContainer, this.getStyle(this.props) ]}>
        <TouchableWithoutFeedback
          style={styles.container}
          delayLongPress={activationTreshold}
          onLongPress={item.inactive ? noop : () => onActivate(item.key)}
        >
          <View style={styles.cell}>
            <View style={styles.container}>{renderItem(item)}</View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  animatedContainer: {
    position: 'absolute',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default Cell;
