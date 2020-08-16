import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { uniqueId, range } from 'lodash';
import SortableGrid from '../src';

test('exists', () => {
  const textPrefix = 'cell_text';
  const data = range(5).map(() => ({ value: uniqueId(textPrefix), key: uniqueId() }));
  const order = data.map(({ key }) => key);
  const renderItem = ({ value }) => (
    <View>
      <Text>{value}</Text>
    </View>
  );

  const { getAllByText } = render(<SortableGrid data={data} order={order} renderItem={renderItem} />);

  const renderedCells = getAllByText(new RegExp(textPrefix));

  expect(renderedCells).toHaveLength(data.length);
});
