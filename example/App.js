import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Button } from 'react-native';
import Slider from '@react-native-community/slider';
import { shuffle, uniqueId, range, random, dropRight } from 'lodash';
import SortableGrid from 'react-native-yet-another-sortable';

export const getColor = () => {
  const r = random(100, 200);
  const g = random(100, 200);
  const b = random(100, 200);
  return `rgb(${r},${g},${b})`;
};

const App = () => {
  const [data, setData] = useState(() => range(50).map(value => ({
    value,
    key: uniqueId('k_'),
    color: getColor(),
  })));
  const [order, setOrder] = useState(() => data.map(({ key }) => key));
  const [blockHeight, setBlockHeight] = useState(50);
  const [itemsPerRow, setItemsPerRow] = useState(10);

  const addEntry = useCallback(() => {
    const key = uniqueId('k_');
    setData(data.concat({ value: random(0, 100), color: getColor(), key }));
    setOrder(order.concat(key));
  }, [data, order]);

  const deleteEntry = useCallback(() => {
    setData(dropRight(data));
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <SortableGrid
          itemsPerRow={itemsPerRow}
          itemOrder={order}
          blockHeight={blockHeight}
          onDragRelease={setOrder}
        >
          {data.map(({ value, key, color }) => (
            <View key={key} style={[styles.block, { backgroundColor: color }]}>
              <Text style={styles.block__text}>{value}</Text>
            </View>
          ))}
        </SortableGrid>
      </View>
      <View style={styles.controls}>
        <View style={styles.controls__entry}>
          <Button title="Shuffle" onPress={() => setOrder(shuffle(order))} />
          <Button title="Delete" onPress={deleteEntry} />
          <Button title="Add" onPress={addEntry} />
        </View>
        <View style={styles.controls__entry}>
          <Text>Items per row: {itemsPerRow}</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={itemsPerRow}
            onSlidingComplete={setItemsPerRow}
            style={styles.container}
          />
        </View>
        <View style={styles.controls__entry}>
          <Text>Block height: {blockHeight}</Text>
          <Slider
            minimumValue={50}
            maximumValue={200}
            step={10}
            value={blockHeight}
            onSlidingComplete={setBlockHeight}
            style={styles.container}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  block: {
    flex: 1,
    margin: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center'
  },
  block__text: {
    color: 'white',
    fontSize: 25,
  },
  grid: {
    flex: 3,
  },
  controls: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  controls__entry: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
});

export default App;
