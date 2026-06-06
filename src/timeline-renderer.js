/**
 * Pure d3 v7 timeline renderer for `granite-timeline`.
 *
 * This module has no dependency on Lit or on the custom element: it renders
 * a timeline SVG into any container element from a data array and a flat
 * options object. It is a modern reimplementation of the rendering features
 * of the (abandoned) `d3-timelines` plugin that granite-timeline v2 wrapped.
 *
 * Data format (unchanged from v2):
 * ```
 * [
 *   {
 *     label: 'series label',          // optional, shown when stacked
 *     myColorProperty: 'apple',       // optional, see colorsProperty
 *     times: [
 *       {
 *         starting_time: 1355752800000,  // ms epoch
 *         ending_time: 1355759900000,    // ms epoch
 *         label: 'bar label',            // optional
 *         color: '#6b0000',              // optional, overrides everything
 *       },
 *     ],
 *   },
 * ]
 * ```
 */

import { select, pointer } from 'd3-selection';
import { scaleTime, scaleOrdinal } from 'd3-scale';
import { axisBottom, axisTop } from 'd3-axis';
import { timeFormat } from 'd3-time-format';
import { schemeCategory10 } from 'd3-scale-chromatic';
import { zoom as d3zoom } from 'd3-zoom';

/**
 * Default rendering options.
 */
export const TIMELINE_DEFAULTS = {
  itemHeight: 20,
  itemMargin: 5,
  margin: { top: 30, right: 30, bottom: 30, left: 30 },
  tickSize: 6,
  maxZoomScale: 1024,
  todayFormat: {
    marginTop: 25,
    marginBottom: 0,
    width: 2,
    color: 'rgb(245, 157, 0)',
  },
};

/** Counter used to generate unique clip-path ids inside a document. */
let clipIdCounter = 0;

/**
 * Computes the time domain of the chart.
 *
 * Uses `beginning`/`ending` when provided, otherwise scans every time entry
 * for the smallest starting_time and the largest ending_time.
 *
 * @param {Array} data the timeline data array
 * @param {Date|undefined} beginning explicit domain start
 * @param {Date|undefined} ending explicit domain end
 * @return {[Date, Date]|null} the domain, or null if it cannot be computed
 */
export function computeDomain(data, beginning, ending) {
  let min = beginning ? beginning.getTime() : Infinity;
  let max = ending ? ending.getTime() : -Infinity;

  if (!beginning || !ending) {
    for (const series of data) {
      for (const time of series.times || []) {
        if (!beginning && time.starting_time < min) {
          min = time.starting_time;
        }
        if (!ending) {
          const end = time.ending_time !== undefined ? time.ending_time : time.starting_time;
          if (end > max) {
            max = end;
          }
        }
      }
    }
  }

  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return null;
  }
  return [new Date(min), new Date(max)];
}

/**
 * Flattens the data array into one bar record per time entry.
 *
 * Row semantics match the original d3-timeline plugin: when `stack` is true
 * each series gets its own row, otherwise everything overlaps on row 0.
 *
 * @param {Array} data the timeline data array
 * @param {boolean} stack whether series are stacked on separate rows
 * @return {Array} flat array of {time, timeIndex, series, seriesIndex, rowIndex}
 */
export function flattenData(data, stack) {
  const flat = [];
  data.forEach((series, seriesIndex) => {
    (series.times || []).forEach((time, timeIndex) => {
      flat.push({
        time,
        timeIndex,
        series,
        seriesIndex,
        rowIndex: stack ? seriesIndex : 0,
      });
    });
  });
  return flat;
}

/**
 * Resolves the fill color of a bar, in the exact priority order of v2:
 * time.color → colorScale(time[colorsProperty]) → colorScale(series[colorsProperty])
 * → colorScale(seriesIndex).
 *
 * @param {Object} record a flattened bar record
 * @param {Function} colorScale the ordinal color scale
 * @param {string|undefined} colorsProperty the property name mapped to the scale
 * @return {string} a CSS color
 */
function resolveColor({ time, series, seriesIndex }, colorScale, colorsProperty) {
  if (time.color) {
    return time.color;
  }
  if (colorsProperty) {
    if (time[colorsProperty] !== undefined) {
      return colorScale(time[colorsProperty]);
    }
    if (series[colorsProperty] !== undefined) {
      return colorScale(series[colorsProperty]);
    }
  }
  return colorScale(seriesIndex);
}

/**
 * Builds the configured time axis.
 *
 * Tick configuration priority: tickValues → tickTime (+ tickInterval) → numTicks.
 * `tickFormat` accepts either a function or a d3 time-format specifier string.
 *
 * @param {Function} xScale the time scale
 * @param {Object} options the normalized options
 * @return {Function} a configured d3 axis
 */
function buildAxis(xScale, options) {
  const axis = (options.axisTop ? axisTop : axisBottom)(xScale);

  if (options.tickValues) {
    axis.tickValues(options.tickValues.map((v) => (v instanceof Date ? v : new Date(v))));
  } else if (options.tickTime) {
    const interval = options.tickInterval > 1
      ? options.tickTime.every(options.tickInterval)
      : options.tickTime;
    if (interval) {
      axis.ticks(interval);
    }
  } else if (options.numTicks) {
    axis.ticks(options.numTicks);
  }

  const format = options.tickFormat || '%I %p';
  axis.tickFormat(typeof format === 'function' ? format : timeFormat(format));

  axis.tickSize(options.tickSize !== undefined ? options.tickSize : TIMELINE_DEFAULTS.tickSize);

  return axis;
}

/**
 * Renders the timeline into `containerEl`, replacing any previous svg.
 *
 * When `options.axisZoom` is set, the time axis can be zoomed with
 * Ctrl/⌘ + mouse wheel (or trackpad pinch), panned by dragging, and zoomed in
 * by double-clicking. `options.onZoom(transform, [start, end])` is called on
 * every user zoom/pan, and a previously saved transform can be restored by
 * passing it back as `options.zoomTransform`.
 *
 * @param {Element} containerEl the element to render into
 * @param {Array} data the timeline data array
 * @param {Object} options normalized options, see granite-timeline.js _buildOptions()
 * @return {{svgNode: SVGElement|null, scale: Function|null}}
 */
export function renderTimeline(containerEl, data, options = {}) {
  select(containerEl).selectAll('svg').remove();

  const itemHeight = options.itemHeight ?? TIMELINE_DEFAULTS.itemHeight;
  const itemMargin = options.itemMargin ?? TIMELINE_DEFAULTS.itemMargin;
  const margin = { ...TIMELINE_DEFAULTS.margin, ...options.margin };
  const width = options.width || 300;

  const domain = computeDomain(data || [], options.beginning, options.ending);
  if (!domain) {
    return { svgNode: null, scale: null };
  }

  const flat = flattenData(data, options.stack);
  const rowCount = options.stack ? data.length : 1;
  const height = options.height
    || margin.top + rowCount * (itemHeight + itemMargin) + margin.bottom;

  const rowY = (rowIndex) => margin.top + (itemHeight + itemMargin) * rowIndex;

  const baseScale = scaleTime()
    .domain(domain)
    .range([margin.left, width - margin.right]);

  const colorScale = options.colors || scaleOrdinal(schemeCategory10);
  const labelText = (label) => (options.labelFormat ? options.labelFormat(label) : String(label));
  const barEnd = (time) => (time.ending_time !== undefined ? time.ending_time : time.starting_time);

  const svg = select(containerEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'granite-timeline');

  const svgNode = svg.node();

  // Row backgrounds
  if (options.background) {
    svg.selectAll('rect.row-background')
      .data(Array.from({ length: rowCount }, (_, i) => i))
      .join('rect')
      .attr('class', 'row-background')
      .attr('x', margin.left)
      .attr('y', (i) => rowY(i) - itemMargin / 2)
      .attr('width', Math.max(0, width - margin.left - margin.right))
      .attr('height', itemHeight + itemMargin)
      .attr('fill', options.background);
  }

  // Row separators (between rows)
  if (options.rowSeparators && rowCount > 1) {
    svg.selectAll('line.row-separator')
      .data(Array.from({ length: rowCount - 1 }, (_, i) => i + 1))
      .join('line')
      .attr('class', 'row-separator')
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (i) => rowY(i) - itemMargin / 2)
      .attr('y2', (i) => rowY(i) - itemMargin / 2)
      .attr('stroke', options.rowSeparators)
      .attr('stroke-width', 1);
  }

  // With zoom enabled, bars / bar labels / today line pan out of the plot
  // area: clip them so they don't bleed under the row labels and margins.
  let plotLayer = svg;
  if (options.axisZoom) {
    const clipId = `granite-timeline-clip-${++clipIdCounter}`;
    svg.append('defs')
      .append('clipPath')
      .attr('id', clipId)
      .append('rect')
      .attr('x', margin.left)
      .attr('y', 0)
      .attr('width', Math.max(0, width - margin.left - margin.right))
      .attr('height', height);
    plotLayer = svg.append('g').attr('clip-path', `url(#${clipId})`);
  }

  // Bars (x-dependent attributes are set in applyScale)
  const bars = plotLayer.selectAll('rect.timeline-bar')
    .data(flat)
    .join('rect')
    .attr('class', (d) => `timeline-bar${d.series.class ? ` ${d.series.class}` : ''}`)
    .attr('y', (d) => rowY(d.rowIndex))
    .attr('height', itemHeight)
    .attr('fill', (d) => resolveColor(d, colorScale, options.colorsProperty));

  // Per-bar labels
  const barLabels = plotLayer.selectAll('text.timeline-bar-label')
    .data(flat.filter((d) => d.time.label !== undefined))
    .join('text')
    .attr('class', 'timeline-bar-label')
    .attr('y', (d) => rowY(d.rowIndex) + itemHeight * 0.75)
    .text((d) => labelText(d.time.label));

  // Series row labels (meaningful when stacked)
  if (options.stack) {
    svg.selectAll('text.timeline-label')
      .data(data.map((series, i) => ({ series, i })).filter((d) => d.series.label !== undefined))
      .join('text')
      .attr('class', 'timeline-label')
      .attr('x', Math.max(0, margin.left - 10))
      .attr('y', (d) => rowY(d.i) + itemHeight * 0.75)
      .attr('text-anchor', 'end')
      .text((d) => labelText(d.series.label));
  }

  // Today line
  let todayLine = null;
  const now = Date.now();
  if (options.showToday && now >= domain[0].getTime() && now <= domain[1].getTime()) {
    const todayFormat = { ...TIMELINE_DEFAULTS.todayFormat, ...options.todayFormat };
    todayLine = plotLayer.append('line')
      .attr('class', 'timeline-today')
      .attr('y1', todayFormat.marginTop)
      .attr('y2', height - todayFormat.marginBottom)
      .attr('stroke', todayFormat.color)
      .attr('stroke-width', todayFormat.width);
  }

  // Time axis
  let axisG = null;
  if (options.showTimeAxis) {
    axisG = svg.append('g')
      .attr('class', 'axis timeline-axis')
      .attr('transform', `translate(0, ${options.axisTop ? margin.top : height - margin.bottom})`);
  }

  /** (Re)applies a time scale to every x-dependent part of the chart. */
  const applyScale = (scale) => {
    bars
      .attr('x', (d) => scale(d.time.starting_time))
      .attr('width', (d) => Math.max(0, scale(barEnd(d.time)) - scale(d.time.starting_time)));
    barLabels.attr('x', (d) => scale(d.time.starting_time) + 5);
    if (todayLine) {
      todayLine.attr('x1', scale(now)).attr('x2', scale(now));
    }
    if (axisG) {
      axisG.call(buildAxis(scale, options));
      if (options.rotateTicks) {
        const rotate = options.rotateTicks;
        axisG.selectAll('text')
          .attr('transform', `rotate(${rotate})`)
          .attr('dx', rotate < 0 ? '-0.8em' : '0.8em')
          .attr('dy', rotate < 0 ? '0.15em' : '0.55em')
          .style('text-anchor', rotate < 0 ? 'end' : 'start');
      }
    }
  };
  applyScale(baseScale);

  // Axis zoom & pan
  if (options.axisZoom) {
    const plotExtent = [[margin.left, 0], [width - margin.right, height]];
    const zoomBehavior = d3zoom()
      .scaleExtent([1, options.maxZoomScale ?? TIMELINE_DEFAULTS.maxZoomScale])
      .extent(plotExtent)
      .translateExtent(plotExtent)
      // Plain wheel keeps scrolling the page: zooming needs Ctrl/⌘ (trackpad
      // pinch gestures report ctrlKey and work out of the box).
      .filter((event) => {
        if (event.type === 'wheel') {
          return event.ctrlKey || event.metaKey;
        }
        return !event.button;
      })
      .on('zoom', (event) => {
        const scale = event.transform.rescaleX(baseScale);
        applyScale(scale);
        // Only report user interactions, not programmatic transform restores
        if (options.onZoom && event.sourceEvent) {
          options.onZoom(event.transform, scale.domain());
        }
      });
    svg.call(zoomBehavior).style('cursor', 'grab');
    if (options.zoomTransform) {
      svg.call(zoomBehavior.transform, options.zoomTransform);
    }
  }

  // Bar events
  if (options.onBarEvent) {
    const emit = (type) => (event, record) => {
      options.onBarEvent(type, {
        d: record.time,
        index: record.timeIndex,
        datum: record.series,
        mouse: pointer(event, svgNode),
        evt: event,
      });
    };
    bars
      .on('click', emit('click'))
      .on('mouseover', emit('mouseover'))
      .on('mouseout', emit('mouseout'))
      .on('mousemove', emit('hover'));
  }

  return { svgNode, scale: baseScale };
}
