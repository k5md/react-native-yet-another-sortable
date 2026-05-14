import React from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop } from './utils';

export class Cell extends React.PureComponent {
  constructor(props) {
    super(props);
    this.initAnimation();
  }

  componentDidUpdate(prevProps) {
    const { rowHeight, blockWidth, grid, item: { key } } = this.props;
    if (blockWidth !== prevProps.blockWidth || rowHeight !== prevProps.rowHeight) {
      this.stopAnimation();
      const position = grid.getPositionByKey(key);
      this.runAnimation({ position, hide: true });
    }
  }

  componentWillUnmount() {
    const { grid, item: { key } } = this.props;
    const order = grid.keyToOrder[key];
    delete grid.keyToOrder[key];
    delete grid.orderToKey[order];
    this.stopAnimation();
  }

  initAnimation() {
    const { grid, item: { key } } = this.props;
    const position = grid.getPositionByKey(key);
    this.position = new Animated.ValueXY(position);
    this.opacity = new Animated.Value(1);
  }

  runAnimation({ position, cb = noop, duration = 1, hide = false }) {
    if (hide) return Animated.sequence([
      Animated.timing(this.opacity, { toValue: 0, duration, useNativeDriver: true }),
      Animated.timing(this.position, { toValue: position, duration, useNativeDriver: true }),
      Animated.timing(this.opacity, { toValue: 1, duration, useNativeDriver: true }),
    ]).start(cb);
    Animated.timing(this.position, { toValue: position, duration, useNativeDriver: true }).start(cb);
  }

  stopAnimation() {
    if (this.position && this.position.stopAnimation) this.position.stopAnimation();
    if (this.opacity && this.opacity.stopAnimation) this.opacity.stopAnimation();
  }

  getStyle() {
    const { rowHeight, active, activation, getActiveStyle, blockWidth } = this.props;
    const style = {
      zIndex: active ? 1 : 0,
      elevation: active ? 1 : 0,
      height: rowHeight,
      width: blockWidth,
      transform: this.position.getTranslateTransform(),
      opacity: this.opacity,
    };
    if (active && getActiveStyle) {
      const { transform = [], ...rest } = getActiveStyle(activation);
      style.transform.push(...transform);
      return { ...style, ...rest };
    }
    return style;
  }

  onActivate = () => {
    this.props.onActivate(this.props.item.key);
  };
  
  render() {
    const { item, activationTreshold, renderItem } = this.props;
    return (
      <Animated.View style={[ styles.animatedContainer, this.getStyle() ]}>
        <TouchableWithoutFeedback
          style={styles.container}
          delayLongPress={activationTreshold}
          onLongPress={item.inactive ? noop : this.onActivate}
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
