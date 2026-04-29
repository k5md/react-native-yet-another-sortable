import React, { memo } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop } from './utils';

const getStyle = ({ position, rotation, active, height, width }) => {
  const transform = position ? position.getTranslateTransform() : [];
  if (rotation) {
    transform.push({
      rotate: rotation.interpolate({
        inputRange: [ 0, 360 ],
        outputRange: [ '0deg', '360deg' ],
      }),
    });
  }    
  const zIndex = active ? 1 : 0;
  return { position: 'absolute', transform, height, width, justifyContent: 'center', zIndex };
};

export function Cell (props) {
  const { item, onActivate, activationTreshold, renderItem } = props;
  return (
    <Animated.View style={getStyle(props)}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cell: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default memo(Cell);
