import '../granite-timeline.js';
import { scaleOrdinal } from 'd3-scale';
import { timeHour } from 'd3-time';

// --- Stacked demo -----------------------------------------------------------

const stackedData = [
  {
    label: 'Build',
    times: [
      { starting_time: 1355752800000, ending_time: 1355759900000 },
      { starting_time: 1355767900000, ending_time: 1355774400000, label: 'nightly' },
    ],
  },
  {
    label: 'Test',
    times: [{ starting_time: 1355759910000, ending_time: 1355761900000 }],
  },
  {
    label: 'Deploy',
    times: [{ starting_time: 1355761910000, ending_time: 1355763910000, label: 'v1.2' }],
  },
];
document.querySelector('#stacked').data = stackedData;

// --- Custom colors demo ------------------------------------------------------

const fruitsEl = document.querySelector('#fruits');
fruitsEl.colors = scaleOrdinal()
  .domain(['apple', 'orange', 'lemon'])
  .range(['#6b0000', '#ef9b0f', '#ffee00']);
fruitsEl.data = [
  {
    label: 'fruit 1',
    fruit: 'orange',
    times: [{ starting_time: 1355759910000, ending_time: 1355761900000 }],
  },
  {
    label: 'fruit 2',
    fruit: 'apple',
    times: [
      { starting_time: 1355752800000, ending_time: 1355759900000 },
      // per-time fruit overrides the series fruit
      { fruit: 'lemon', starting_time: 1355767900000, ending_time: 1355774400000 },
    ],
  },
  {
    label: 'fruit 3',
    fruit: 'lemon',
    times: [
      // per-time color overrides everything
      { color: '#2196f3', starting_time: 1355761910000, ending_time: 1355763910000 },
    ],
  },
];

// --- Today line + tick configuration demo ------------------------------------

const HOUR = 3600000;
const now = Date.now();
const todayEl = document.querySelector('#today');
todayEl.tickTime = timeHour;
todayEl.data = [
  {
    label: 'Morning',
    times: [{ starting_time: now - 10 * HOUR, ending_time: now - 6 * HOUR }],
  },
  {
    label: 'Afternoon',
    times: [
      { starting_time: now - 4 * HOUR, ending_time: now - 1 * HOUR },
      { starting_time: now + 2 * HOUR, ending_time: now + 5 * HOUR },
    ],
  },
];
todayEl.beginning = now - 12 * HOUR;
todayEl.ending = now + 12 * HOUR;

// --- Axis zoom & pan demo ------------------------------------------------------

const DAY = 24 * HOUR;
const zoomEl = document.querySelector('#zoom');
const zoomStart = now - 5 * DAY;
const makeTimes = (offset, count, duration) => Array.from({ length: count }, (_, i) => ({
  starting_time: zoomStart + offset + i * ((6 * DAY) / count),
  ending_time: zoomStart + offset + i * ((6 * DAY) / count) + duration,
}));
zoomEl.data = [
  { label: 'Deploys', times: makeTimes(0, 48, 15 * 60000) },
  { label: 'Incidents', times: makeTimes(2 * HOUR, 10, 2 * HOUR) },
  { label: 'Backups', times: makeTimes(HOUR, 24, 45 * 60000) },
];
const zoomLog = document.querySelector('#zoom-log');
zoomEl.addEventListener('zoom', (e) => {
  const { start, end, transform } = e.detail;
  zoomLog.textContent = `visible: ${start.toLocaleString()} → ${end.toLocaleString()} `
    + `(zoom ×${transform.k.toFixed(2)})`;
});
document.querySelector('#reset-zoom').addEventListener('click', () => {
  zoomEl.resetZoom();
  zoomLog.textContent = '(zoom reset)';
});

// --- Events demo --------------------------------------------------------------

const eventsEl = document.querySelector('#events');
eventsEl.data = stackedData;
const log = document.querySelector('#event-log');
for (const type of ['click', 'mouseover', 'mouseout', 'hover']) {
  eventsEl.addEventListener(type, (e) => {
    if (!e.detail?.d) {
      return; // native click on the host, not a bar event
    }
    const { d, index, datum, mouse } = e.detail;
    log.textContent = `${type}  series="${datum.label}" index=${index} `
      + `start=${new Date(d.starting_time).toLocaleTimeString()} `
      + `mouse=[${mouse.map(Math.round)}]`;
  });
}
