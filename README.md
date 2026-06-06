[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/LostInBrittany/granite-timeline)

# granite-timeline

A timeline rendering web component built with [Lit](https://lit.dev) and [d3](https://d3js.org) v7.

**Live demo**: [https://lostinbrittany.github.io/granite-timeline/demo/](https://lostinbrittany.github.io/granite-timeline/demo/)

> **v3.0.0** is a full rewrite: Lit instead of Polymer, native d3 v7 rendering instead of the
> abandoned `d3-timelines` plugin, plain ES modules, no polyfills, no runtime script loading.
> See [Migration from v2](#migration-from-v2).

## Install

```sh
npm install @granite-elements/granite-timeline
```

## Usage

```js
import '@granite-elements/granite-timeline';
```

```html
<granite-timeline
    data='[{"times":[{"starting_time":1355752800000,"ending_time":1355759900000}, {"starting_time":1355767900000,"ending_time":1355774400000}]},{"times":[{"starting_time":1355759910000,"ending_time":1355761900000}]}]'
    show-time-axis></granite-timeline>
```

Function- and object-valued options are set as properties:

```js
import { scaleOrdinal } from 'd3-scale';
import { timeHour } from 'd3-time';

const el = document.querySelector('granite-timeline');
el.data = [
  { label: 'fruit 1', fruit: 'orange', times: [
    { starting_time: 1355759910000, ending_time: 1355761900000 }] },
  { label: 'fruit 2', fruit: 'apple', times: [
    { starting_time: 1355752800000, ending_time: 1355759900000 }] },
];
el.colors = scaleOrdinal().domain(['apple', 'orange']).range(['#6b0000', '#ef9b0f']);
el.colorsProperty = 'fruit';
el.tickTime = timeHour;
```

## Data format

```js
[
  {
    label: 'series label',     // optional, shown on the left when `stack` is set
    times: [
      {
        starting_time: 1355752800000,  // ms epoch
        ending_time: 1355759900000,    // ms epoch
        label: 'bar label',            // optional
        color: '#6b0000',              // optional, overrides the color scale
      },
    ],
  },
]
```

## Properties

| Property | Attribute | Type | Default | Description |
|---|---|---|---|---|
| `data` | `data` | Array | `[]` | The timeline data (see above) |
| `width` | `width` | Number | element width | Width of the timeline in pixels |
| `height` | `height` | Number | computed | Height of the timeline in pixels |
| `itemHeight` | `item-height` | Number | `20` | Height of a data series row |
| `itemMargin` | `item-margin` | Number | `5` | Margin between data series rows |
| `marginTop` | `margin-top` | Number | `30` | Top margin |
| `marginBottom` | `margin-bottom` | Number | `30` | Bottom margin |
| `marginLeft` | `margin-left` | Number | `30` | Left margin |
| `marginRight` | `margin-right` | Number | `30` | Right margin |
| `tickFormat` | `tick-format` | String\|Function | `'%I %p'` | d3 time-format specifier, or a `(date) => string` function (property only) |
| `tickTime` | — | d3-time interval | — | Tick time unit, e.g. `timeHour` from `d3-time` |
| `tickInterval` | `tick-interval` | Number | `1` | Tick interval, used with `tickTime` |
| `numTicks` | `num-ticks` | Number | — | Number of ticks, used when `tickTime` is unset |
| `tickSize` | `tick-size` | Number | `6` | Tick size in pixels |
| `tickValues` | — | Array | — | Explicit tick values (Date or ms epoch) |
| `rotateTicks` | `rotate-ticks` | Number | `0` | Rotation of the tick labels in degrees |
| `axisTop` | `axis-top` | Boolean | `false` | Places the time axis on top |
| `axisZoom` | `axis-zoom` | Boolean | `false` | Enables zooming (Ctrl/⌘ + wheel, pinch, double-click) and panning (drag) of the time axis |
| `colors` | — | d3 ordinal scale | `scaleOrdinal(schemeCategory10)` | Color scale for the series |
| `colorsProperty` | `colors-property` | String | — | Data property mapped to the `colors` scale |
| `beginning` | `beginning` | Date\|Number\|String | computed | Start of the timeline |
| `ending` | `ending` | Date\|Number\|String | computed | End of the timeline |
| `stack` | `stack` | Boolean | `false` | Stacks each data series on its own row |
| `showToday` | `show-today` | Boolean | `false` | Shows a vertical line at the current time |
| `todayMarginTop` | `today-margin-top` | Number | `25` | Top margin of the today line |
| `todayMarginBottom` | `today-margin-bottom` | Number | `0` | Bottom margin of the today line |
| `todayWidth` | `today-width` | Number | `2` | Stroke width of the today line |
| `todayColor` | `today-color` | String | `rgb(245, 157, 0)` | Color of the today line |
| `showTimeAxis` | `show-time-axis` | Boolean | `false` | Shows the time axis |
| `background` | `background` | String | — | Background color of the rows |
| `rowSeparators` | `row-separators` | String | — | Color of the separator lines between rows |
| `labelFormat` | — | Function | — | Maps a raw `label` value to its display text |
| `debug` | `debug` | Boolean | `false` | Logs debug information to the console |

Color resolution order for each bar: `time.color` → `colors(time[colorsProperty])` →
`colors(series[colorsProperty])` → `colors(seriesIndex)`.

## Events

All events are `CustomEvent`s dispatched from the element, with
`detail: { d, index, datum, mouse, evt }` where `d` is the time entry, `index` its index
in the series, `datum` the series object, `mouse` the `[x, y]` pointer position in the
SVG, and `evt` the originating DOM event.

| Event | Fired on |
|---|---|
| `click` | Click on a timeline bar |
| `mouseover` | Pointer enters a bar |
| `mouseout` | Pointer leaves a bar |
| `hover` | Pointer moves over a bar |

Note: a `click` listener also receives native click events from the element; check
`event.detail?.d` to distinguish bar clicks.

When `axisZoom` is enabled, a `zoom` event is fired on every zoom/pan, with
`detail: { start, end, transform }` where `start`/`end` are the `Date` bounds of the
visible domain and `transform` the d3 zoom transform.

## Methods

| Method | Description |
|---|---|
| `resetZoom()` | Resets the axis zoom/pan to the initial full-domain view |

## Styling

The chart renders in shadow DOM. Customization hooks:

| Hook | Description |
|---|---|
| `--granite-timeline-label-color` | Color of the series and bar labels |
| `--granite-timeline-axis-color` | Color of the time axis |
| `::part(timeline)` | The chart container |

## Demo

Live version: [https://lostinbrittany.github.io/granite-timeline/demo/](https://lostinbrittany.github.io/granite-timeline/demo/)

To run it locally:

```sh
npm install
npm run dev    # open http://localhost:5173/demo/
```

## Migration from v2

- **No more script loading**: d3 is now a regular ES-module dependency. Remove any
  `granite-js-dependencies-grabber` setup; `bower` and the webcomponentsjs polyfills are gone.
- **Dropped properties**: `displayCircles`, `relativeTime`, `showBorderLine` (+ its
  `borderLine*` format properties), `showTimeAxisTick` (+ `timeAxisTick*`),
  `xAxisClass`. Open an issue if you need one of them back.
- **`axisZoom`** is kept, but zooming with the mouse wheel now requires
  <kbd>Ctrl</kbd>/<kbd>⌘</kbd> so the chart doesn't hijack page scrolling; drag pans,
  and a `zoom` event reports the visible domain.
- **Dropped events**: `scroll`. The `i` field of event details is gone — use `index`.
- **Tick intervals**: `tickTime` now takes a modern d3-time interval
  (`import { timeHour } from 'd3-time'`) instead of the old `d3.time.hours`.
- **`tickFormat`** is now a single value (string specifier or function) instead of the
  v2 object — the other tick options moved to top-level properties (unchanged names).
- **Default palette** changed from `d3.scale.category20()` (removed in d3 v7) to
  `scaleOrdinal(schemeCategory10)`.
- **Shadow DOM styling**: page CSS no longer reaches the chart internals. Use the CSS
  custom properties / `part` listed above.

## License

[MIT License](http://opensource.org/licenses/MIT)
