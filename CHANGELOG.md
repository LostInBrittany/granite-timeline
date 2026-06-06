# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-06-06

Full rewrite. See the [migration guide](README.md#migration-from-v2) in the README.

### Changed

- **Lit 3** replaces Polymer 3.
- **Native d3 v7 rendering** (`src/timeline-renderer.js`, a pure module usable
  without the element) replaces the abandoned `d3-timelines` plugin.
- d3 is now a regular ES-module dependency: no more runtime script loading via
  `granite-js-dependencies-grabber`, no more webcomponentsjs polyfills.
- Responsive redraw via `ResizeObserver` (v2 read the width once at startup).
- `tickFormat` is a single value — a d3 time-format specifier string (usable as
  an HTML attribute) or a `(date) => string` function — instead of the v2 object.
- `tickTime` takes a modern d3-time interval (`import { timeHour } from 'd3-time'`)
  instead of the old `d3.time.*`.
- Default color palette changed from `d3.scale.category20()` (removed in d3 v7)
  to `scaleOrdinal(schemeCategory10)`.
- Wheel zooming (with `axisZoom`) now requires Ctrl/⌘ so the chart doesn't
  hijack page scrolling; trackpad pinch works without modifier.
- The chart renders in shadow DOM: page CSS no longer styles the internals.
  Use the CSS custom properties (`--granite-timeline-label-color`,
  `--granite-timeline-axis-color`) or `::part(timeline)`.

### Added

- `zoom` event reporting the visible domain: `detail: {start, end, transform}`.
- `resetZoom()` method restoring the full-domain view.
- Zoom/pan transform persists across redraws (resize, data updates).
- Bars, bar labels and the today line are clipped to the plot area when zooming.

### Removed

- `displayCircles`, `relativeTime`, `showBorderLine` (+ `borderLine*` format
  properties), `showTimeAxisTick` (+ `timeAxisTick*`), `xAxisClass`.
- `scroll` event, and the redundant `i` field of event details (use `index`).
- Bower support and the Polymer toolchain (`polymer.json`).

## [2.0.0] - 2018-06-04

### Changed

- Migrated to npm-based Polymer 3 (ES modules instead of HTML imports).

## 1.0.x - 2017-2018

- Initial Polymer 1.x/2.x element wrapping the d3-timelines plugin,
  distributed via Bower.

[3.0.0]: https://github.com/LostInBrittany/granite-timeline/compare/2.0.0...3.0.0
[2.0.0]: https://github.com/LostInBrittany/granite-timeline/compare/1.0.9...2.0.0
