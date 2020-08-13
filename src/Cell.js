import React, { Component } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop, union } from 'lodash';

class Cell extends Component {
  shouldComponentUpdate = (nextProps) => {
    if (this.props === nextProps) {
      return false;
    }
    const [oldKeys, newKeys] = [Object.keys(this.props), Object.keys(nextProps)];
    const keys = union(oldKeys, newKeys);
    for (let key of keys) {
      if (this.props[key] !== nextProps[key]) {
        return true;
      }
    }
    return false;
  };

  render() {
    const {
      item,
      style,
      activateDrag,
      activationTreshold,
      renderItem,
      height,
      width,
      translateX,
      translateY,
      blockPositionsSet,
      rotate,
      zIndex,
    } = this.props;
    const renderedItem = renderItem(item);
    return (
      <Animated.View
        style={[
          style,
          { justifyContent: 'center', height, width },
          blockPositionsSet
            ? {
                position: 'absolute',
                transform: [{ translateX }, { translateY }, { rotate }],
              }
            : {},
        ]}
      >
        <TouchableWithoutFeedback
          style={styles.container}
          delayLongPress={activationTreshold}
          onLongPress={item.inactive ? noop : () => activateDrag(item.key)}
        >
          <View style={styles.cell}>
            <View style={styles.container}>{renderedItem}</View>
          </View>
        </TouchableWithoutFeedback>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default Cell;
