/* eslint-disable eqeqeq */
import React, { Component } from 'react';
import { ScrollView, View } from 'react-native';
import { shape, number, string, objectOf, arrayOf, func, object } from 'prop-types';
import { clamp } from 'lodash';
import SortableGrid from './Grid';

class ScrollableGrid extends Component {
  scrollView = React.createRef();
  scrollOffset = { x: 0, y: 0 };
  activeBlockOffset = { x: 0, y: 0};
  keepScrolling = false;
  layout = null;



  childrenRefs = {};



  onGrantBlock = (evt, gestureState, grid) => {
    const activeBlockPosition = grid.getActiveBlock().origin;
    const x = activeBlockPosition.x - gestureState.x0;
    const y = activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y;
    this.activeBlockOffset = { x, y };
    return this.props.onGrantBlock(evt, gestureState, grid);
  };

  onMoveBlock = (evt, gestureState, grid) => {
    let dragPosition = {
      x: gestureState.moveX + this.activeBlockOffset.x,
      y: gestureState.moveY + this.activeBlockOffset.y,
    };
    const activeBlock = grid.getActiveBlock();
    const originalPosition = activeBlock.origin;

    const scrollThreshold = grid.props.blockHeight / 5;
    const scrollUp = dragPosition.y < scrollThreshold && this.scrollOffset.y > 0;
    const scrollDown =
      dragPosition.y > this.layout.height - this.layout.y - scrollThreshold &&
      dragPosition.y + this.scrollOffset.y + scrollThreshold < grid.gridHeight;

    const scrollBy = (scrollUp * -1 + scrollDown * 1) * grid.props.blockHeight;

    const clampX = x => clamp(x, 0, grid.gridWidth - grid.blockWidth);
    const clampY = y => clamp(y, 0, grid.gridHeight - grid.props.blockHeight);

    if (!scrollDown && !scrollUp) {
      const actualDragPosition = {
        x: clampX(dragPosition.x),
        y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
      };
      activeBlock.currentPosition.setValue(actualDragPosition);
      grid.moveBlock(originalPosition, actualDragPosition);
      this.keepScrolling = clearInterval(this.keepScrolling);
    } else {
      const actualDragPosition = {
        x: clampX(dragPosition.x),
        y: clampY(dragPosition.y + this.scrollOffset.y),
      };
      activeBlock.currentPosition.setValue(actualDragPosition);
      grid.moveBlock(originalPosition, actualDragPosition);
      this.keepScrolling = clearInterval(this.keepScrolling);
      this.keepScrolling = setInterval(() => {
        const activeBlock = grid.getActiveBlock();
        const originalPosition = activeBlock.origin;
        const actualDragPosition = {
          x: clampX(dragPosition.x),
          y: clampY(dragPosition.y + this.scrollOffset.y + scrollBy),
        };
        this.scrollView.current.scrollTo({ y: this.scrollOffset.y + scrollBy });
        activeBlock.currentPosition.setValue(actualDragPosition);
        grid.moveBlock(originalPosition, actualDragPosition);
      }, 250);
    }

    this.props.onMoveBlock(evt, gestureState, grid);
    return true;
  };

  onReleaseBlock = (evt, gestureState, grid) => {
    this.panCapture = false;
    this.keepScrolling = clearInterval(this.keepScrolling);
    return this.props.onReleaseBlock(evt, gestureState, grid);
  };

  onLayout = ({ nativeEvent }) => {
    this.layout = nativeEvent.layout;
  };

  onScroll = ({ nativeEvent }) => {
    this.scrollOffset = nativeEvent.contentOffset;
  };

  activateDrag = () => {
    this.panCapture = true;
  };

  render = () => (
    <ScrollView
      ref={this.scrollView}
      onLayout={this.onLayout}
      onScroll={this.onScroll}
      scrollEnabled={!this.panCapture}
      showsVerticalScrollIndicator={false}
      canCancelContentTouches={false}
    >
      <SortableGrid
        {...this.props}
        onGrantBlock={this.onGrantBlock}
        onMoveBlock={this.onMoveBlock}
        onReleaseBlock={this.onReleaseBlock}
        activateDrag={this.activateDrag}
      />
    </ScrollView>
  );
}

ScrollableGrid.propTypes = {
  transitionDuration: number,
  columns: number,
  activationThreshold: number,
  order: arrayOf(string).isRequired,
  children: arrayOf(
    shape({
      key: string,
    }),
  ),
  onDragRelease: func,
  blockHeight: number.isRequired,
  style: object,
  onGrantBlock: func,
  onReleaseBlock: func,
  onMoveBlock: func,
};

ScrollableGrid.defaultProps = {
  transitionDuration: 200,
  columns: 4,
  activationThreshold: 200,
  style: {},
  onGrantBlock: () => {},
  onReleaseBlock: () => {},
  onMoveBlock: () => {},
};

module.exports = ScrollableGrid;
