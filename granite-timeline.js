import { LitElement, html, css } from 'lit';
import { renderTimeline } from './src/timeline-renderer.js';

/**
 * Converter for the `beginning`/`ending` attributes: accepts a ms-epoch
 * number, an ISO date string, or (as a property) a Date.
 */
const dateConverter = {
  fromAttribute(value) {
    if (value === null || value === '') {
      return undefined;
    }
    const asNumber = Number(value);
    return new Date(Number.isNaN(asNumber) ? value : asNumber);
  },
  toAttribute(value) {
    return value instanceof Date ? value.toISOString() : value;
  },
};

/** Normalizes a Date | ms-number | string property value to a Date. */
const toDate = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value instanceof Date ? value : new Date(value);
};

/**
 * `granite-timeline`
 *
 * A timeline rendering web component using Lit and d3.
 *
 * ```html
 * <granite-timeline
 *     data='[{"times":[{"starting_time":1355752800000,"ending_time":1355759900000}]}]'
 *     show-time-axis></granite-timeline>
 * ```
 *
 * @element granite-timeline
 *
 * @fires click - Fired on click on a timeline bar. detail: {d, index, datum, mouse, evt}
 * @fires mouseover - Fired on mouseover of a timeline bar. detail: {d, index, datum, mouse, evt}
 * @fires mouseout - Fired on mouseout of a timeline bar. detail: {d, index, datum, mouse, evt}
 * @fires hover - Fired on mouse move over a timeline bar. detail: {d, index, datum, mouse, evt}
 * @fires zoom - Fired when the visible domain changes by zooming/panning. detail: {start, end, transform}
 *
 * @cssprop --granite-timeline-label-color - Color of the series and bar labels
 * @cssprop --granite-timeline-axis-color - Color of the time axis line and ticks
 *
 * @demo demo/index.html
 */
export class GraniteTimeline extends LitElement {
  static properties = {
    /**
     * The timeline data:
     * `[{label?, times: [{starting_time, ending_time, label?, color?}]}]`
     */
    data: { type: Array },
    /** Width of the timeline in pixels. Defaults to the element width. */
    width: { type: Number },
    /** Height of the timeline in pixels. Computed from the rows if unset. */
    height: { type: Number },
    /** Height of a data series row in pixels. Default: 20 */
    itemHeight: { type: Number, attribute: 'item-height' },
    /** Margin between data series rows in pixels. Default: 5 */
    itemMargin: { type: Number, attribute: 'item-margin' },
    /** Top margin in pixels. Default: 30 */
    marginTop: { type: Number, attribute: 'margin-top' },
    /** Bottom margin in pixels. Default: 30 */
    marginBottom: { type: Number, attribute: 'margin-bottom' },
    /** Left margin in pixels. Default: 30 */
    marginLeft: { type: Number, attribute: 'margin-left' },
    /** Right margin in pixels. Default: 30 */
    marginRight: { type: Number, attribute: 'margin-right' },
    /**
     * Tick label format: a d3 time-format specifier string (e.g. `%H:%M`)
     * or, as a property, a `(date) => string` function. Default: `%I %p`
     */
    tickFormat: { attribute: 'tick-format' },
    /**
     * Time unit of the ticks: a d3-time interval, e.g.
     * `import { timeHour } from 'd3-time'`. Property only.
     */
    tickTime: { attribute: false },
    /** Tick interval, used together with `tickTime`. Default: 1 */
    tickInterval: { type: Number, attribute: 'tick-interval' },
    /** Number of ticks, used when `tickTime` is not set. */
    numTicks: { type: Number, attribute: 'num-ticks' },
    /** Tick size in pixels. Default: 6 */
    tickSize: { type: Number, attribute: 'tick-size' },
    /** Explicit tick values (array of Date or ms-epoch). Property only. */
    tickValues: { attribute: false },
    /** Degrees of rotation of the tick labels. Default: 0 */
    rotateTicks: { type: Number, attribute: 'rotate-ticks' },
    /** If set, the time axis is placed on top instead of the bottom. */
    axisTop: { type: Boolean, attribute: 'axis-top' },
    /**
     * If set, the time axis can be zoomed with Ctrl/⌘ + mouse wheel (or
     * trackpad pinch), panned by dragging, and zoomed in by double-clicking.
     */
    axisZoom: { type: Boolean, attribute: 'axis-zoom' },
    /**
     * A d3 ordinal color scale for the data series.
     * Default: `scaleOrdinal(schemeCategory10)`. Property only.
     */
    colors: { attribute: false },
    /**
     * Data item property name that maps data items to the `colors` scale.
     * Looked up on the time entry first, then on the series.
     */
    colorsProperty: { type: String, attribute: 'colors-property' },
    /** Start of the timeline. Computed from the data if unset. */
    beginning: { converter: dateConverter },
    /** End of the timeline. Computed from the data if unset. */
    ending: { converter: dateConverter },
    /** If set, each data series is stacked on its own row. */
    stack: { type: Boolean },
    /** If set, a vertical line shows the current time. */
    showToday: { type: Boolean, attribute: 'show-today' },
    /** Top margin of the today line. Default: 25 */
    todayMarginTop: { type: Number, attribute: 'today-margin-top' },
    /** Bottom margin of the today line. Default: 0 */
    todayMarginBottom: { type: Number, attribute: 'today-margin-bottom' },
    /** Stroke width of the today line. Default: 2 */
    todayWidth: { type: Number, attribute: 'today-width' },
    /** Color of the today line. Default: rgb(245, 157, 0) */
    todayColor: { type: String, attribute: 'today-color' },
    /** If set, the time axis is shown. */
    showTimeAxis: { type: Boolean, attribute: 'show-time-axis' },
    /** Background color of the rows. */
    background: { type: String },
    /** Color of the horizontal separator lines between rows. */
    rowSeparators: { type: String, attribute: 'row-separators' },
    /**
     * Callback generating the text of series and bar labels from the raw
     * `label` value, e.g. `(label) => label[currentLocale]`. Property only.
     */
    labelFormat: { attribute: false },
    /** If set, debug information is logged to the console. */
    debug: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
    }
    #timeline {
      width: 100%;
    }
    .timeline-label,
    .timeline-bar-label {
      font: 12px sans-serif;
      fill: var(--granite-timeline-label-color, currentColor);
    }
    .timeline-axis {
      color: var(--granite-timeline-axis-color, currentColor);
      font: 10px sans-serif;
    }
  `;

  constructor() {
    super();
    this.data = [];
    this.axisTop = false;
    this.axisZoom = false;
    this.stack = false;
    this.showToday = false;
    this.showTimeAxis = false;
    this.debug = false;
  }

  render() {
    return html`<div id="timeline" part="timeline"></div>`;
  }

  connectedCallback() {
    super.connectedCallback();
    // Re-observe on reconnection; initial observation happens in firstUpdated()
    this._resizeObserver?.observe(this);
  }

  firstUpdated() {
    this._container = this.renderRoot.querySelector('#timeline');
    this._resizeObserver = new ResizeObserver(() => this._requestDraw());
    this._resizeObserver.observe(this);
  }

  updated() {
    this._requestDraw();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  /** Resets the axis zoom/pan to the initial full-domain view. */
  resetZoom() {
    this._zoomTransform = undefined;
    this._requestDraw();
  }

  /** Coalesces draw requests (property updates + resizes) into one redraw. */
  _requestDraw() {
    if (this._drawQueued) {
      return;
    }
    this._drawQueued = true;
    queueMicrotask(() => {
      this._drawQueued = false;
      this._draw();
    });
  }

  /** Builds the normalized options object for the renderer. */
  _buildOptions(width) {
    return {
      width,
      height: this.height,
      itemHeight: this.itemHeight,
      itemMargin: this.itemMargin,
      margin: {
        ...(this.marginTop !== undefined && { top: this.marginTop }),
        ...(this.marginBottom !== undefined && { bottom: this.marginBottom }),
        ...(this.marginLeft !== undefined && { left: this.marginLeft }),
        ...(this.marginRight !== undefined && { right: this.marginRight }),
      },
      tickFormat: this.tickFormat,
      tickTime: this.tickTime,
      tickInterval: this.tickInterval,
      numTicks: this.numTicks,
      tickSize: this.tickSize,
      tickValues: this.tickValues,
      rotateTicks: this.rotateTicks,
      axisTop: this.axisTop,
      axisZoom: this.axisZoom,
      zoomTransform: this._zoomTransform,
      onZoom: (transform, [start, end]) => {
        this._zoomTransform = transform;
        this.dispatchEvent(new CustomEvent('zoom', {
          detail: { start, end, transform },
          bubbles: true,
          composed: true,
        }));
      },
      colors: this.colors,
      colorsProperty: this.colorsProperty,
      beginning: toDate(this.beginning),
      ending: toDate(this.ending),
      stack: this.stack,
      showToday: this.showToday,
      todayFormat: {
        ...(this.todayMarginTop !== undefined && { marginTop: this.todayMarginTop }),
        ...(this.todayMarginBottom !== undefined && { marginBottom: this.todayMarginBottom }),
        ...(this.todayWidth !== undefined && { width: this.todayWidth }),
        ...(this.todayColor !== undefined && { color: this.todayColor }),
      },
      showTimeAxis: this.showTimeAxis,
      background: this.background,
      rowSeparators: this.rowSeparators,
      labelFormat: this.labelFormat,
      onBarEvent: (type, detail) => {
        this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
      },
      debug: this.debug,
    };
  }

  _draw() {
    if (!this._container || !this.isConnected) {
      return;
    }
    const width = this.width || this._container.clientWidth || 300;
    if (this.debug) {
      console.log('[granite-timeline] draw - Drawing', this.data);
    }
    renderTimeline(this._container, this.data || [], this._buildOptions(width));
  }
}

if (!customElements.get('granite-timeline')) {
  customElements.define('granite-timeline', GraniteTimeline);
}
