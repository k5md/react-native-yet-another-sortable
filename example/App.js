import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
} from 'react-native';

import examples from './examples';

const App = () => {
  return (
      <SafeAreaView>
        <ScrollView contentInsetAdjustmentBehavior="automatic">
          {examples.map(({ title, Example }) => (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>{title}</Text>
              <Example />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: 'black',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: 'black',
  },
});

export default App;
