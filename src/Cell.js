import React, { PureComponent } from 'react';
import { Animated, TouchableWithoutFeedback, View, StyleSheet } from 'react-native';
import { noop } from 'lodash';
import { shape, number, string, func, object, bool, oneOfType } from 'prop-types';

class Cell extends PureComponent {
  getStyle = () => {
    const { rotation, position, active, width, height } = this.props;
    const rotate = rotation
      ? rotation.interpolate({ inputRange: [0, 360], outputRange: ['0 deg', '360 deg'] })
      : '0deg';
    const translates = position ? position.getTranslateTransform() : [];
    const transform = translates.concat({ rotate });
    const zIndex = active ? 1 : 0;
    return { position: 'absolute', transform, height, width, justifyContent: 'center', zIndex };
  };

  render() {
    const { item, onActivate, activationTreshold, renderItem } = this.props;
    const renderedItem = renderItem(item);
    return (
      <Animated.View style={this.getStyle()}>
        <TouchableWithoutFeedback
          style={styles.container}
          delayLongPress={activationTreshold}
          onLongPress={item.inactive ? noop : () => onActivate(item.key)}
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

Cell.propTypes = {
  item: shape({ key: string }).isRequired,
  renderItem: func.isRequired,
  activationTreshold: number,
  onActivate: func,
  height: number,
  width: number,
  active: bool,
  position: oneOfType([object, bool]),
  rotation: oneOfType([object, bool]),
};

Cell.defaultProps = {};

export default Cell;
