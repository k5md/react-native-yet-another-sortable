import React from 'react';
import { View, Text } from 'react-native'; 
import { render, act } from '@testing-library/react-native';
import { uniqueId, range } from 'lodash';
import { SortableGrid } from 'react-native-yet-another-sortable';

describe('SortableGrid tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('exists', async () => {
    const textPrefix = 'cell_text';
    const items = range(5).map(() => ({ value: uniqueId(textPrefix), key: uniqueId() }));
    const order = items.map(({ key }) => key);
    const renderItem = ({ value }) => (
      <View>
        <Text>{value}</Text>
      </View>
    );

    const gridRef = React.createRef();
    const { getAllByText } = render(
      <SortableGrid 
        ref={gridRef}
        items={items} 
        order={order} 
        renderItem={renderItem}
      />
    );

    act(() => {
      gridRef.current.onLayout({ nativeEvent: { layout: { width: 400, height: 2000, x: 0, y: 0 } } });
    });
    
    act(() => {
      jest.runAllTimers();
    });

    const renderedCells = getAllByText(new RegExp(textPrefix));
    expect(renderedCells).toHaveLength(items.length);
  });
});