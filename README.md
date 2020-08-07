# react-native-yet-another-sortable

## Why

- custom block height, change on the fly
- able to change number of columns on the fly
- better performance
- manage order
- scrollable

## Getting Started

## Installation

```
npm install react-native-yet-another-sortable --save
```

## Usage

Check out example project

```javascript
const Example = () => {
  const [data] = useState([
    { value: 0, key: 'key0' },
    { value: 1, key: 'key1' },
    { value: 2, key: 'key2' },
  ]);

  const [order, setOrder] = useState(['key2', 'key1', 'key0']);

  return (
    <SortableGrid
      itemsPerRow={1}
      blockHeight={100}
      itemOrder={order}
      onDragRelease={setOrder}
    >
      {data.map(({ value, key, color }) => (
        <View key={key}>
          <Text>{value}</Text>
        </View>
      ))}
    </SortableGrid>
  );
};

```

## Props
| parameter  | type   | required | description |
| :--------  | :----  | :------- | :---------- |
| itemsPerRow | number | no | number of entries rendered per row |
| itemOrder | array of strings | yes | array of keys |
| blockHeight | number | yes | entry height |
| style | object | no | styles applied to grid container |

## Event Props
| parameter  | type   | required | description |
| :--------  | :----  | :------- | :---------- |
| onDragRelease | itemOrder => void | yes |  Will execute when item is released, returns new order |

## Item Props
| parameter  | type   | required | description |
| :--------  | :----  | :------- | :---------- |
| inactive | boolean | no      | Makes block not draggable |

## Resort item

if you want resort item yourself,you only need change the data's sort, and the draggable-grid will auto resort by your data.

> the data's key must unique

## 

if you want resort item yourself,you only need change the data's sort, and the draggable-grid will auto resort by your data.

> the data's key must unique


## Development

In order to develop the application or build android .apk from the sources one should:
1. Clone this repository
2. Install dependencies with `npm install`
3. run Metro bundler with `react-native start`
4. Connect an emulator or physical device via adb, like this (tested with [mEMU](https://www.memuplay.com/)):
	- `adb connect 127.0.0.1:21503`
	- `adb reverse tcp:8081 tcp:8081`
5. build and watch with `react-native run-android`

