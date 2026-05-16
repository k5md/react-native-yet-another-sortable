<!-- API_DOCS_START -->

## Classes

<a id="sortablegrid"></a>

### SortableGrid

Renders `items` as grid by passing each item to `renderItem`. Each item must have unique `key` property.
Cell order must be provided in `order` array of keys.
After user rearranges grid cells by dragging, `onDeactivateDrag` callback gets called with updated order as an argument.
Activation animation can be customized with `animateActiveStyle` and `getActiveStyle` props.

```
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { SortableGrid } from 'react-native-yet-another-sortable';
const Component = () => {
  const [ items, setItems ] = useState(Array.from({ length: 5 }, (_, i) => ({ value: i, key: i })));
  const [ order, setOrder ] = useState(items.map(({ key }) => key));
  return (
    <SortableGrid
      items={items}
      order={order}
      renderItem={({ value }) => (<View><Text>{value}</Text></View>)}
      onDeactivateDrag={(order) => setOrder(order)}
    />
  );
};
```

#### Extends

- `PureComponent`\<[`SortableGridProps`](#sortablegridprops)\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`Item`](#item) |

#### Constructors

<a id="constructor"></a>

##### Constructor

```ts
new SortableGrid<T>(props: SortableGridProps): SortableGrid<T>;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `props` | [`SortableGridProps`](#sortablegridprops) |

###### Returns

[`SortableGrid`](#sortablegrid)\<`T`\>

###### Inherited from

```ts
React.PureComponent<SortableGridProps<T>>.constructor
```

##### Constructor

```ts
new SortableGrid<T>(props: SortableGridProps, context: any): SortableGrid<T>;
```

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `props` | [`SortableGridProps`](#sortablegridprops) | - |
| `context` | `any` | value of the parent [Context](https://react.dev/reference/react/Component#context) specified in `contextType`. |

###### Returns

[`SortableGrid`](#sortablegrid)\<`T`\>

###### Inherited from

```ts
React.PureComponent<SortableGridProps<T>>.constructor
```

#### Properties

<a id="defaultprops"></a>

##### defaultProps

```ts
static defaultProps: Partial<Omit<SortableGridProps<any>, "renderItem" | "items" | "order">>;
```

## Interfaces

<a id="item"></a>

### Item

#### Indexable

```ts
[key: string]: any
```

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-dragdisabled"></a> `dragDisabled?` | `boolean` | makes cell not draggable, still allowing it to be swapped with other cells |
| <a id="property-key"></a> `key` | `Key` | key used to order items |

***

<a id="sortablegridprops"></a>

### SortableGridProps

#### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`Item`](#item) |

#### Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-activationthreshold"></a> `activationThreshold` | `number` | hold time in ms required to activate drag |
| <a id="property-animateactivestyle"></a> `animateActiveStyle` | (`animation`: `Value`) => `number` | animates `animation` value, returns requestAnimationFrame identifier or nothing for cleanup, use it to achieve custom activation effects. If not provided defaults to: `(animation) => requestAnimationFrame(() => { animation.setValue(1); Animated.spring(animation, { toValue: 0, velocity: 2000, tension: 2000, friction: 5, useNativeDriver: true }).start(); })` |
| <a id="property-columns"></a> `columns` | `number` | number of columns per row |
| <a id="property-getactivestyle"></a> `getActiveStyle` | (`animation`: `Value`) => `CSSProperties` | provides styles for cell from `animation`, use it to achieve custom activation effects. If not provided, defaults to rotation and elevation: `(animation) => ({ transform: [ { rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '1deg'] }) } ], elevation: 10, zIndex: 1, })` |
| <a id="property-items"></a> `items` | `T`[] | array of items each to be passed to `renderItem` |
| <a id="property-onactivatedrag"></a> `onActivateDrag` | (`key`: `Key`, `gridInstance`: [`SortableGrid`](#sortablegrid)\<`T`\>) => `any` | will execute after one holds the item for `activateTreshold` ms, before `onGrantBlock`, return truthy value to override default behaviour |
| <a id="property-ondeactivatedrag"></a> `onDeactivateDrag` | (`order`: `Key`[], `gridInstance`: [`SortableGrid`](#sortablegrid)\<`T`\>) => `any` | will execute on active item drop, after `onReleaseBlock`, with new order array as argument, return truthy value to override default behaviour |
| <a id="property-ongrantblock"></a> `onGrantBlock` | (...`args`: \[`GestureResponderEvent`, `PanResponderGestureState`, [`SortableGrid`](#sortablegrid)\<`T`\>\]) => `any` | will execute on drag start, return truthy value to override default behaviour |
| <a id="property-onmoveblock"></a> `onMoveBlock` | (...`args`: \[`GestureResponderEvent`, `PanResponderGestureState`, [`SortableGrid`](#sortablegrid)\<`T`\>\]) => `any` | will execute on every move, return truthy value to override default behaviour |
| <a id="property-onreleaseblock"></a> `onReleaseBlock` | (...`args`: \[`GestureResponderEvent`, `PanResponderGestureState`, [`SortableGrid`](#sortablegrid)\<`T`\>\]) => `any` | will execute on drag release, return truthy value to override default behaviour |
| <a id="property-order"></a> `order` | `Key`[] | array of item `key` properties specifying items order in grid |
| <a id="property-pinned"></a> `pinned` | `Set`\<`Key`\> | set of keys for cells that will not be swapped with others |
| <a id="property-renderitem"></a> `renderItem` | (`item`: `any`) => [`ReactNode`](#) | render function for each item |
| <a id="property-rowheight"></a> `rowHeight` | `number` | row height in pixels |
| <a id="property-scrollstep"></a> `scrollStep` | `number` | number of pixels to autoscroll when item is held close to upper or lower boundary of container |
| <a id="property-transitionduration"></a> `transitionDuration` | `number` | time in ms required to move cell to its position on release or swap |


<!-- API_DOCS_END -->