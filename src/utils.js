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

export const getDistance = (pointA, pointB) => {
  const xDistance = pointA.x - pointB.x;
  const yDistance = pointA.y - pointB.y;
  return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
};
