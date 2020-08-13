import React, { useRef, useEffect, useMemo } from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';
import { noop, merge, reduce, isEqual, union } from 'lodash';
import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';
import { StyleSheet } from 'react-native';

class Cell extends React.Component {
  shouldComponentUpdate = (nextProps) => {
    if (this.props !== nextProps) {
      const oldKeys = Object.keys(this.props);
      const newKeys = Object.keys(nextProps);
      const keys = union(oldKeys, newKeys);
      for (key of keys) {
        if (this.props[key] !== nextProps[key]) {
          return true;
        }
      }
    };
    return false;
  }

  render() {
    const { item, style, activateDrag, activationTreshold, renderItem, height, width, translateX, translateY,
       blockPositionsSet,
      rotate, zIndex } = this.props;
      const renderedItem = renderItem(item);
    console.log('rerender');
      return (
        <Animated.View style={[style, { justifyContent: 'center', height, width }, 
          blockPositionsSet ? {
            position: 'absolute',
            transform: [  
              { translateX },
              { translateY },
              { rotate },
            ]
          } : {},
      ]}>
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
    };
  }

module.exports = Cell;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
});



