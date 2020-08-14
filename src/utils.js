import { Animated } from 'react-native';

export const animateTiming = (value, toValue, duration, cb) => {
  return setTimeout(() => {
    Animated.timing(value, { toValue, duration, useNativeDriver: true }).start(cb);
  });
};

export const animateWiggle = (value, from, toValue, duration, cb = () => {}) => {
  return setTimeout(() => {
    value.setValue(from);
    Animated.spring(value, {
      toValue,
      duration,
      velocity: 2000,
      tension: 2000,
      friction: 5,
      useNativeDriver: true,
    }).start(cb);
  });
};
