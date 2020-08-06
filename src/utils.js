import { Animated } from 'react-native';

export const animateTiming = (animatable, to, duration = 200, callback = () => {}) => {
  return Animated.timing(animatable, {
    toValue: to,
    duration,
    useNativeDriver: true,
  }).start(callback);
};

export const animateSpring = (animatable, from, to, callback = () => {}) => {
  animatable.setValue(from);
  return Animated.spring(animatable, {
    toValue: to,
    velocity: 2000,
    tension: 2000,
    friction: 5,
    useNativeDriver: true,
  }).start(callback);
};
