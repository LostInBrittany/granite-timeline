import { PolymerElement } from '@polymer/polymer/polymer-element.js';
import '@granite-elements/granite-js-dependencies-grabber/granite-js-dependencies-grabber.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

/* globals d3 */
/**
 * `granite-timeline`
 * A timeline rendering element using d3 and d3-timelines plugin
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class GraniteTimeline extends PolymerElement {
  static get template() {
    return html`
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
      #timeline {
        width: 100%;
        height: 100%;
      }
    </style>

    <granite-js-dependencies-grabber 
        dependencies="[[_dependencies]]" 
        on-dependency-is-ready="_onDependencyIsReady" 
        debug="[[debug]]"></granite-js-dependencies-grabber>
    <div id="timeline"></div>

`;
  }

  /** 
   * In order to statically import non ES mudules resources, you need to use `importPath`.
   * But in order to use `importPath`, for elements defined in ES modules, users should implement
   * `static get importMeta() { return import.meta; }`, and the default
   * implementation of `importPath` will  return `import.meta.url`'s path.
   * More info on @Polymer/lib/mixins/element-mixin.js`
   */
  static get importMeta() { return import.meta; } 

  static get is() { return 'granite-timeline'; }

  /**
   * Fired on mouseover of the timeline data.
   *
   * @event mouseover
   * @param object d The current rendering object
   * @param number i The index during d3 rendering
   * @param object datum The data object
   */

  /**
   * Fired on mouseout of the timeline data.
   *
   * @event mouseout
   * @param object d The current rendering object
   * @param number i The index during d3 rendering
   * @param object datum The data object
   */

  /**
   * Fired on click of the timeline data.
   *
   * @event click
   * @param object d The current rendering object
   * @param number i The index during d3 rendering
   * @param object datum The data object
   */

  /**
   * Fired on hover of the timeline data.
   *
   * @event hover
   * @param object d The current rendering object
   * @param number i The index during d3 rendering
   * @param object datum The data object
   */


  /**
   * Fired on scroll of the timeline data.
   *
   * @event scroll
   * @param object d The current rendering object
   * @param number i The index during d3 rendering
   * @param object datum The data object
   */

  static get properties() {
    return {
      data: {
        type: Array,
        value: () => [],
        observer: '_onDataChanged',
      },
      chart: {
        type: Object,
        value: () => {},
      },

      /**
       * Sets the width of the timeline. If the width of the timeline is longer than
       * the width of the svg object, the timeline will automatically scroll. The width
       * of the timeline will default to the width of the svg if width is not set.
       */
      width: {
        type: Number,
      },
      /**
       * Sets the height of the timeline. The height of the timeline will be automatically
       * calculated from the height of each item if height is not set on the
       * timeline or the svg.
       */
      height: {
        type: Number,
      },
      /**
       * Sets the height of the data series in the timeline in pixels. Default: 20
       */
      itemHeight: {
        type: Number,
      },
      /**
       * Sets the margin between the data series in the timeline in pixels. Default: 5
       */
      itemMargin: {
        type: Number,
      },
      /**
       * Sets the top margin in pixel. Default: 30
       */
      marginTop: {
        type: Number,
      },
      /**
       * Sets the bottom margin in pixel. Default: 30
       */
      marginBottom: {
        type: Number,
      },
      /**
       * Sets the left margin in pixel. Default: 30
       */
      marginLeft: {
        type: Number,
      },
      /**
       * Sets the right margin in pixel. Default: 30
       */
      marginRight: {
        type: Number,
      },

      /**
       * By default the data is displayed as rectangles (`.display('rect')`).
       * If set, data series are displayed as circles (`.display('circle')`).
       */
      displayCircles: {
        type: Boolean,
        value: false,
      },

      /**
       * registers a function to be called when the text for the label needs to be
       * generated. Useful if your label looks like this:
       * ```
       * {
       *   en: "my label",
       *   fr: "mon étiquette"
       * }
       * The callback function is passed the whatever the datum.label returns, so in this
       * case it would be the object above. So the `labelFormat` might look something like
       * this:
       *
       * `(label) => label[currentLocale]`
       */
      labelFormat: {
        type: Object,
      },

      /**
       * sets the formatting of the ticks in the timeline. Default: d3.time.format("%I %p")
       */
      tickFormat: {
        type: Object,
      },
      /**
       * sets the time unit of the ticks in the timeline.
       *
       * Tick interval/values can be set with:
       *
       * `tickTime` and `tickInterval`
       * `numTicks` and `tickInterval`
       * `tickValues`
       *
       * Default: d3.time.hours
       */
      tickTime: {
        type: Object,
      },
      /**
       * sets the tick interval for the ticks in the timeline.
       *
       * Tick interval/values can be set with:
       *
       * `tickTime` and `tickInterval`
       * `numTicks` and `tickInterval`
       * `tickValues`
       *
       * Default: 1
       */
       tickInterval: {
         type: Number,
      },
      /**
       * sets the number of ticks in the timeline.
       *
       * Tick interval/values can be set with:
       *
       * `tickTime` and `tickInterval`
       * `numTicks` and `tickInterval`
       * `tickValues`
       *
       * Default: not set
       */
      numTicks: {
        type: Object,
      },
      /**
       * sets the tick size for the ticks in the timeline. Default: 6
       */
      tickSize: {
         type: Number,
      },
      /**
       * sets the values of the ticks in the timeline.
       *
       * Default: not set
       */
       tickValues: {
        type: Array,
      },

      /**
       * sets the degree of rotation of the tickmarks. Defaults to no rotation (0 degrees)
       */
      rotateTicks: {
        type: Number,
      },

      /**
       * By default the axis in at the bottom (`.orient('bottom')`).
       * If set, the axis is placed on top  (`.orient('top')`).
       */
      axisTop: {
        type: Boolean,
        value: false,
      },

      /**
       * Callback setting the d3 color scale the data series in the timeline.
       * Default: `d3.scale.category20()`
       */
      colors: {
        type: Object,
      },

      /**
       * sets the data item property name that maps your data items to your color scale.
       * For example if you set your chart's `colors` and `colorsProperty` as follows:
       *
       * var colorScale = d3.scale.ordinal()
       *    .range(['#6b0000','#ef9b0f','#ffee00'])
       *    .domain(['apple','orange','lemon']);
       *
       * [...]
       *
       * <granite-timeline colors="{{colorScale}}" color-property="fruit">
       * </granite-timeline>
       *
       * And pass this dataset:
       *
       * var testData = [
       *    {label: "fruit 1", fruit: "orange", times: [
       *      {"starting_time": 1355759910000, "ending_time": 1355761900000}]},
       *    {label: "fruit 2", fruit: "apple", times: [
       *      {"starting_time": 1355752800000, "ending_time": 1355759900000},
       *      {"starting_time": 1355767900000, "ending_time": 1355774400000}]},
       *    {label: "fruit3", fruit: "lemon", times: [
       *      {"starting_time": 1355761910000, "ending_time": 1355763910000}]}
       * ];
       *
       * Your chart's bar colors will be determined based on the value of the fruit property
       *
       * You can also set the color property for a specific time object:
       *
       * var testData = [
       *  {label: "fruit 2", fruit: "apple", times: [
       *    {fruit: "orange", "starting_time": 1355752800000, "ending_time": 1355759900000},
       *    {"starting_time": 1355767900000, "ending_time": 1355774400000},
       *  {fruit: "lemon", "starting_time": 1355774400000, "ending_time": 1355775500000}]}
       *  ];
       *
       * Properties set in the time object will override the property set for the series
       */
      colorsProperty: {
        type: String,
      },

      /**
       * sets the time that the timeline should start. If beginning and ending are not set,
       * the timeline will calculate it based off of the smallest and largest times.
       */
      beginning: {
        type: Date,
      },
      /**
       * sets the time that the timeline should stop. If beginning and ending are not set,
       * the timeline will calculate it based off of the smallest and largest times.
       */
      ending: {
        type: Date,
      },

      /**
       * Toggles the stacking/unstacking of data series in the timeline.
       */
      stack: {
        type: Boolean,
        value: false,
      },

      /**
       * Toggles the calculation and use of relative timestamps.
       * The origin of the timeline will be set to 0 and the starting_time of the
       * first data dictionary in the data array will be subtracted from every
       * subsequent timestamp.
       */
       relativeTime: {
        type: Boolean,
        value: false,
      },

      /**
       * Toggles a vertical line showing the current `Date.now()` time.
       */
       showToday: {
        type: Boolean,
        value: false,
      },
      /**
       * Sets the formatting of the showToday line
       */
      todayMarginTop: {
        type: Number,
      },
      /**
       * Sets the formatting of the showToday line
       */
      todayMarginBottom: {
        type: Number,
      },
      /**
       * Sets the formatting of the showToday line
       */
      todayWidth: {
        type: Number,
      },
      /**
       * Sets the formatting of the showToday line
       */
      todayColor: {
        type: String,
      },

      /**
       * Toggles a vertical line showing the borders of one specific timeline.
       */
       showBorderLine: {
        type: Boolean,
        value: false,
      },
      /**
       * Sets the formatting of the showBorderLine line
       */
      borderLineMarginTop: {
        type: Number,
      },
      /**
       * Sets the formatting of the showBorderLine line
       */
      borderLineMarginBottom: {
        type: Number,
      },
      /**
       * Sets the formatting of the showBorderLine line
       */
      borderLineWidth: {
        type: Number,
      },
      /**
       * Sets the formatting of the showBorderLine line
       */
       borderLineColor: {
        type: String,
      },

      /**
       * Toggles the visibility of the time axis.
       */
       showTimeAxis: {
        type: Boolean,
        value: false,
      },
      /**
       * Shows tick marks along the X axis.
       * Useful for datasets with a lot of stacked elements.
       */
       showTimeAxisTick: {
        type: Boolean,
        value: false,
      },
      /**
       * Sets the formatting of the showTimeAxisTick lines. Default: 'stroke-dasharray'
       */
      timeAxisTickStroke: {
        type: String,
      },
      /**
       * Sets the formatting of the showTimeAxisTick lines. Default: '4 10'
       */
      timeAxisTickSpacing: {
        type: String,
      },

      /**
       * Sets the class for the x axis. Default: 'timeline-xAxis'
       */
      xAxisClass: {
        type: String,
      },

      /**
       * If set, zooming is allowed
       */
       axisZoom: {
        type: Boolean,
        default: false,
      },

      /**
       * Sets the background of the rows. Useful for creating a continuous effect
       * when there are gaps in your data.
       */
      background: {
        type: String,
      },

      /**
       * Sets the display of horizontal lines betweens rows.
       */
      rowSeparators: {
        type: String,
      },

      debug: {
        type: Boolean,
        value: false,
      },
      _libReady: {
        type: Boolean,
        value: false,
      },
      /**
       * The application dependencies
       */
       _dependencies: {
        type: Array,
        value: [
          {name: 'd3', url: `${this.importPath}../../d3/dist/d3.min.js`},
          {name: 'd3.timelines', url: `${this.importPath}../../d3-timelines/dist/d3-timelines.js`},
        ],
      },
    };
  }

  // -----------------------------------------------------------------------
  // Livecycle
  // -----------------------------------------------------------------------
  connectedCallback() {
    super.connectedCallback();
    if (this.debug) {
      console.log('[granite-timeline] connectedCallback');
    }
  }

  // -----------------------------------------------------------------------
  // Observers
  // -----------------------------------------------------------------------
  _onDataChanged() {
    this.draw();
  }

  // -----------------------------------------------------------------------
  // Event listeners
  // -----------------------------------------------------------------------
  _onDependencyIsReady(evt) {
    if (this.debug) {
      console.log('[granite-timeline] _onDependencyIsReady', evt.detail.name,this.$.timeline);
    }
    if (evt.detail.name !== 'd3.timelines') {
      return;
    }
    this._width = this.$.timeline.clientWidth || 300;
    this._libReady = true;
  }

  // -----------------------------------------------------------------------
  // Other methods
  // -----------------------------------------------------------------------
  _setProperties() {
    if (this.width) {
      this.chart.width(this.width);
    }
    if (this.height) {
      this.chart.height(this.height);
    }
    if (this.itemHeight) {
      this.chart.itemHeight(this.itemHeight);
    }
    if (this.itemMargin) {
      this.chart.itemMargin(this.itemMargin);
    }

    let margin = this.chart.margin();
    if (this.marginTop !== undefined) {
      margin.top = this.marginTop;
    }
    if (this.marginBottom !== undefined) {
      margin.bottom = this.marginBottom;
    }
    if (this.marginLeft !== undefined) {
      margin.left = this.marginLeft;
    }
    if (this.marginRight !== undefined) {
      margin.right = this.marginRight;
    }
    this.chart.margin(margin);

    if (this.displayCircles) {
      this.chart.display('circle');
    }

    if (this.labelFormat) {
      this.chart.labelFormat(this.labelFormat);
    }

    let tickFormat = this.chart.tickFormat();
    if (this.tickFormat) {
      tickFormat.format = this.tickFormat;
    }
    if (this.tickTime) {
      tickFormat.tickTime = this.tickTime;
    }
    if (this.tickInterval) {
      tickFormat.tickInterval = this.tickInterval;
    }
    if (this.tickSize) {
      tickFormat.tickSize = this.tickSize;
    }
    if (this.numTicks) {
      tickFormat.numTicks = this.numTicks;
    }
    if (this.tickValues) {
      tickFormat.tickValues = this.tickValues;
    }
    this.chart.tickFormat(tickFormat);


    if (this.rotateTicks) {
      this.chart.rotateTicks(this.rotateTicks);
    }

    if (this.axisTop) {
      this.chart.orient('top');
    }

    if (this.colors) {
      this.chart.colors(this.colors);
    }

    if (this.colorsProperty) {
      this.chart.colorsProperty(this.colorsProperty);
    }

    if (this.beginning) {
      this.chart.beginning(this.beginning);
    }
    if (this.ending) {
      this.chart.ending(this.ending);
    }

    if (this.stack) {
      this.chart.stack();
    }

    if (this.relativeTime) {
      this.chart.relativeTime();
    }

    if (this.showToday) {
      this.chart.showToday();
    }

    let showTodayFormat = this.chart.showTodayFormat();
    if (this.todayMarginTop) {
      showTodayFormat.marginTop = this.todayMarginTop;
    }
    if (this.todayMarginBottom) {
      showTodayFormat.marginBottom = this.todayMarginBottom;
    }
    if (this.todayWidth) {
      showTodayFormat.width = this.todayWidth;
    }
    if (this.todayColor) {
      showTodayFormat.color = this.todayColor;
    }
    this.chart.showTodayFormat(showTodayFormat);

    if (this.showBorderLine) {
      this.chart.showBorderLine();
    }

    let borderFormat = this.chart.showBorderFormat();
    if (this.borderLineMarginTop) {
      borderFormat.marginTop = this.borderLineMarginTop;
    }
    if (this.borderLineMarginBottom) {
      borderFormat.borderLineBottom = this.borderLineMarginBottom;
    }
    if (this.borderLineWidth) {
      borderFormat.width = this.borderLineWidth;
    }
    if (this.borderLineColor) {
      borderFormat.color = this.borderLineColor;
    }
    this.chart.showBorderFormat(borderFormat);

    if (this.showTimeAxis) {
      this.chart.showTimeAxis();
    }
    if (this.showTimeAxisTick) {
      this.chart.showTimeAxisTick();
    }
    let showTimeAxisTickFormat = this.chart.showTimeAxisTickFormat();
    if (this.timeAxisTickStroke) {
      showTimeAxisTickFormat.stroke = this.timeAxisTickStroke;
    }
    if (this.timeAxisTickSpacing) {
      showTimeAxisTickFormat.spacing = this.timeAxisTickSpacing;
    }
    this.chart.showTimeAxisTickFormat(showTimeAxisTickFormat);

    if (this.xAxisClass) {
      this.chart.xAxisClass(this.xAxisClass);
    }
    if (this.axisZoom) {
      this.chart.axisZoom();
    }

    if (this.background) {
      this.chart.background(this.background);
    }
    if (this.rowSeparators) {
      this.chart.rowSeparators(this.rowSeparators);
    }
  }

  _setListeners() {
    this.chart
      .mouseover((d, index, datum, i) => {
        let evt = d3.event;
        let mouse = d3.mouse(this);
        this.dispatchEvent(new CustomEvent('mouseover', {detail: {d, index, datum, i, evt, mouse}}));
      })
      .mouseout((d, index, datum, i) => {
        let evt = d3.event;
        let mouse = d3.mouse(this);
        this.dispatchEvent(new CustomEvent('mouseout', {detail: {d, index, datum, i, evt, mouse}}));
      })
      .hover((d, index, datum, i) => {
        let evt = d3.event;
        let mouse = d3.mouse(this);
        this.dispatchEvent(new CustomEvent('hover', {detail: {d, index, datum, i, evt, mouse}}));
      })
      .click((d, index, datum, i) => {
        let evt = d3.event;
        let mouse = d3.mouse(this);
        this.dispatchEvent(new CustomEvent('click', {detail: {d, index, datum, i, evt, mouse}}));
      })
      .scroll((d, index, datum, i) => {
        let evt = d3.event;
        let mouse = d3.mouse(this);
        this.dispatchEvent(new CustomEvent('scroll', {detail: {d, index, datum, i, evt, mouse}}));
      });
  }

  draw() {
    if (!this._libReady) {
      if (!this._interval) {
        this._interval = setInterval(() => this.draw(), 5);
      }
      return;
    }
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
    if (this.debug) {
      console.log('[granite-timeline] draw - Drawing', this.data);
    }

    this.chart = d3.timelines();
    this._setProperties();
    this._setListeners();

    d3.select(this.$.timeline)
      .append('svg').attr('width', this._width)
      .datum(this.data).call(this.chart);
  }
}

window.customElements.define(GraniteTimeline.is, GraniteTimeline);
