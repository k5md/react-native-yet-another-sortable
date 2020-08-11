import React from 'react';
import { Animated, TouchableWithoutFeedback, View } from 'react-native';
import { noop } from 'lodash';
import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';
import { StyleSheet } from 'react-native';

const Cell = ({ item, style, activateDrag, activationTreshold }) => (
    <Animated.View style={style} >
      <TouchableWithoutFeedback
        style={styles.container}
        delayLongPress={activationTreshold}
        onLongPress={item.inactive ? noop : activateDrag}
      >
        <View style={styles.cell}>
          <View style={styles.container}>{item}</View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );

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



