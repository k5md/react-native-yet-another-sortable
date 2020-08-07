import React from 'react';
import { View, Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { uniqueId, range } from 'lodash';
import SortableGrid from '../src';

test('exists', () => {
  const textPrefix = 'cell_text';
  const data = range(5).map(() => ({ value: uniqueId(textPrefix), key: uniqueId()}));
  const order = data.map(({ key }) => key);
  const columns = 1;
  const blockHeight = 10;

  const { getAllByText } = render(
    <SortableGrid columns={columns} order={order} blockHeight={blockHeight}>
      {data.map(({ value, key }) => (
        <View key={key}>
          <Text>{value}</Text>
        </View>
      ))}
    </SortableGrid>
  );

  const renderedCells = getAllByText(new RegExp(textPrefix));

  expect(renderedCells).toHaveLength(data.length);
});
