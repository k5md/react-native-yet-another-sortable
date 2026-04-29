import React, { Component } from 'react';
import { ScrollView } from 'react-native';
import { noop, clamp } from './utils';

const makeScrollable = (WrappedComponent) => {
  class Scrollable extends Component {
    scrollView = React.createRef();
    grid = null;
    scrollOffset = { x: 0, y: 0 };
    activeBlockOffset = { x: 0, y: 0 };
    latestMoveX = 0;
    latestMoveY = 0;
    layout = null;
    panCapture = false;
    autoScrollTimer = null;

    onGrantBlock = (evt, gestureState, grid) => {
      this.panCapture = true;
      this.grid = grid;
      const activeBlockPosition = grid.getTargetXY(grid.keyToOrder[grid.activeBlockKey], grid.props.columns, grid.blockWidth, grid.props.rowHeight);
      const x = activeBlockPosition.x - gestureState.x0;
      const y = activeBlockPosition.y - gestureState.y0 - this.scrollOffset.y;
      this.activeBlockOffset = { x, y };
      this.latestMoveX = gestureState.x0;
      this.latestMoveY = gestureState.y0;
      this.props.onGrantBlock(evt, gestureState, grid);
      return false;
    };

    onMoveBlock = (evt, gestureState, grid) => {
      this.grid = grid;
      this.latestMoveX = gestureState.moveX;
      this.latestMoveY = gestureState.moveY;

      const dragPosition = {
        x: this.latestMoveX + this.activeBlockOffset.x,
        y: this.latestMoveY + this.activeBlockOffset.y + this.scrollOffset.y,
      };

      const scrollThreshold = grid.props.rowHeight;
      const scrollUp = (gestureState.moveY - (this.layout ? this.layout.y : 0)) < scrollThreshold && this.scrollOffset.y > 0;
      const scrollDown =
        (gestureState.moveY - (this.layout ? this.layout.y : 0)) > (this.layout ? this.layout.height : 0) - scrollThreshold &&
        this.scrollOffset.y + (this.layout ? this.layout.height : 0) < grid.layout.height;

      const actualDragPosition = {
        x: clamp(dragPosition.x, 0, grid.layout.width - grid.blockWidth),
        y: clamp(dragPosition.y, 0, grid.layout.height - grid.props.rowHeight),
      };

      grid.getActiveBlock().setValue(actualDragPosition);
      grid.moveBlock(actualDragPosition);

      if (!this.autoScrollTimer) {
        this.handleAutoScroll();
      }

      this.props.onMoveBlock(evt, gestureState, grid);
      return true;
    }

    onReleaseBlock = (evt, gestureState, grid) => {
      this.stopAutoScroll();
      this.panCapture = false;
      this.grid = null;
      this.props.onReleaseBlock(evt, gestureState, grid);
      this.forceUpdate();
      return false;
    };

    onActivateDrag = (...args) => {
      this.panCapture = true;
      this.forceUpdate();
      this.props.onActivateDrag(...args);
      return false;
    };

    onLayout = ({ nativeEvent }) => {
      this.layout = nativeEvent.layout;
    };

    onScroll = ({ nativeEvent }) => {
      this.scrollOffset = nativeEvent.contentOffset;

      if (this.panCapture && this.grid && this.grid.activeBlockKey) {
        const dragPosition = {
          x: this.latestMoveX + this.activeBlockOffset.x,
          y: this.latestMoveY + this.activeBlockOffset.y + this.scrollOffset.y,
        };

        const actualDragPosition = {
          x: clamp(dragPosition.x, 0, this.grid.layout.width - this.grid.blockWidth),
          y: clamp(dragPosition.y, 0, this.grid.layout.height - this.grid.props.rowHeight),
        };

        this.grid.getActiveBlock().setValue(actualDragPosition);
        this.grid.moveBlock(actualDragPosition);

        if (!this.autoScrollTimer) {
          this.handleAutoScroll();
        }
      }
    };

    handleAutoScroll = () => {
      if (!this.panCapture || !this.grid || !this.layout) {
        this.stopAutoScroll();
        return;
      }
      const threshold = this.grid.props.rowHeight;
      const relY = this.latestMoveY - this.layout.y;
      let diff = 0;
      if (relY < threshold && this.scrollOffset.y > 0) diff = -15;
      else if (relY > this.layout.height - threshold && this.scrollOffset.y + this.layout.height < this.grid.layout.height) diff = 15;
      if (diff !== 0) {
        this.scrollView.current.scrollTo({ y: this.scrollOffset.y + diff, animated: false });
        this.autoScrollTimer = requestAnimationFrame(this.handleAutoScroll);
      } else {
        this.stopAutoScroll();
      }
    };
    
    stopAutoScroll = () => {
      cancelAnimationFrame(this.autoScrollTimer);
      this.autoScrollTimer = null;
    };

    render = () => (
      <ScrollView
        ref={this.scrollView}
        onLayout={this.onLayout}
        onScroll={this.onScroll}
        scrollEnabled={!this.panCapture}
        showsVerticalScrollIndicator={false}
        canCancelContentTouches={false}
        scrollEventThrottle={16}
        removeClippedSubviews
      >
        <WrappedComponent
          {...this.props}
          onGrantBlock={this.onGrantBlock}
          onMoveBlock={this.onMoveBlock}
          onReleaseBlock={this.onReleaseBlock}
          onActivateDrag={this.onActivateDrag}
        />
      </ScrollView>
    );
  }

  Scrollable.defaultProps = {
    onGrantBlock: noop,
    onMoveBlock: noop,
    onReleaseBlock: noop,
    onActivateDrag: noop,
  };

  return Scrollable;
};

export default makeScrollable;
