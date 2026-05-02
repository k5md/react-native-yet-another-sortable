import React, { memo, PureComponent } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop } from './utils';

const getStyle = ({ height, position, active, activation, activeStyle, columns }) => {
  const style = {
    zIndex: active ? 1 : 0,
    height,
    width: 100 / columns + '%',
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

export class Cell extends React.PureComponent {
  render() {
    console.log('render');
    const { item, onActivate, activationTreshold, renderItem } = this.props;
    return (
      <Animated.View style={[ styles.animatedContainer, getStyle(this.props) ]}>
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
