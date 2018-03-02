import * as d3 from 'd3';

const FIRST_RECORD = 0;
const IDX_XRANGE_START = 0;
const IDX_XRANGE_END = 1;
const ONEDAY = 24 * 60 * 60 * 1000;
const QUARTER_THRESHOLD = 518 * ONEDAY; // empirically determined
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const IDX_CATEGORY = 0;
const IDX_FROMDATE = 1;
const IDX_TODATE = 2;
const IDX_LABEL = 3;
const IDX_INFO = 4;
const IDX_LOAD = 5;

const MARGIN_TOP = 20; // 20 px for x-axis labels
const MARGIN_RIGHT = 40; // right margin should provide space for last horz. axis label
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 160; // left margin should provide space for y axis labels

const BOTTOM_SPACE = 10; // vertical overhang of vertical grid lines on bottom
const XGRIDLINE_OVERFLOW = 30; // x-axis gridline will overflow the current chart width by this length (on both sides)

const DEFAULT_BARHEIGHT = 24;
const BAR_STROKEWIDTH = 1;
const DEFAULT_BARCOLOR = '#777';
const DEFAULT_TEXTCOLOR = '#fff';
const MIN_BARWIDTH = 60; // min pixels to put content into bar

const DEFAULT_LABELYWIDTH = MARGIN_LEFT; // space fo y-axis labels
const SPACE = 4; // space between the elements (bar space, text padding, ...)
const DEFAULT_CATEGORY = '__CAT__';
const CHARTCONFIG_DEFAULT = {
	timeSpan: null,
	consecutive: false,
	gridlinesXaxis: true,
	gridlinesYaxis: true,
	infoLabel: 'Information',
	bar: { height: DEFAULT_BARHEIGHT, border: false },
	labelYwidth: DEFAULT_LABELYWIDTH
};

const DATE_RE = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
const DATETIME_RE = new RegExp(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

class D3RoadmapChart {

	constructor(containerId) {
		this.componentId = containerId;
		this.component = null;

		this.tooltipDiv = null;
		this.tooltipId = this.componentId + '_tooltip';
		this.svg = null;
		this.svgId = this.componentId + '_svg';

		this._drawChart = this._drawChart.bind(this);
		this._mouseOvered = this._mouseOvered.bind(this);
		this._mouseOuted = this._mouseOuted.bind(this);
	}

	_stopEventPropagation(event) {
		if (event) {
			event.stopPropagation();
			event.preventDefault();
		}
	}
	_mouseOvered(d) {
		this._stopEventPropagation(d3.event);
		const target = d3.event.target;
		const svg = document.getElementById(this.svgId);
		const targetX = +target.attributes.x.value;

		// check parents for row number (1st parent holds row number)
		let rowNum = null;
		let pn = target.parentNode;
		while (!rowNum && pn && pn !== svg) {
			if (pn.attributes['row']) {
				rowNum = pn.attributes['row'].value;
			} else {
				pn = pn.parentNode;
			}
		}

		// tooltip positionieren!
		rowNum = +(rowNum ? rowNum : 0);
		const tooltip = {
				left: this.margin.left + targetX + 16,
				top: (rowNum + 1) * this.lineHeight + this.margin.top + this.offsetTop + SPACE
		};

		tooltip.left = tooltip.left > this.width - 100 ? this.width - 100 : tooltip.left;
		this._renderTooltip(d);
		this.tooltipDiv
			.style('top', tooltip.top + 'px')
			.style('left', tooltip.left + 'px')
			.transition().duration(500).style('opacity', 1.0);
	}

	_mouseOuted() {
		this._stopEventPropagation(d3.event);
		this.tooltipDiv.transition().duration(500).style('opacity', 0.0);

	}

	_drawChart() {
		this._adjustChart();
		this._drawAxes();
		this._drawData()
	}

	_adjustChart() {
		this.margin = {
			left: this.config.labelYwidth || DEFAULT_LABELYWIDTH,
			top: MARGIN_TOP,
			bottom: MARGIN_BOTTOM,
			right: MARGIN_RIGHT
		};

		// the chart's netto width
		this.component = this.component || document.getElementById(this.componentId);
		this.width = this.component.parentElement.clientWidth - this.margin.left - this.margin.right;
		this.offsetTop = this.component.offsetTop; // need for tooltip positioning

		// range of dates that will be shown
		// if from-date (1st element) or to-date (2nd element) is zero,
		// it will be determined according to the min- and max-times within the dataset (default: automatically)
		if (this.config.timeSpan && this.config.timeSpan.length > 1) {
			this.displayDateRange = [Date.parse(this.config.timeSpan[IDX_XRANGE_START]), Date.parse(this.config.timeSpan[IDX_XRANGE_END])];
		} else {
			this.displayDateRange = [0,0];
		}

		this.isDateOnlyFormat = null; // used date/time format (yyyy-mm-dd or yyyy-mm-dd HH:MM:SS)

		this.barHeight = this.config.bar.height; // height of horizontal data bars
		this.barSpace = this.barHeight >> 2; // vertical space between bars
		this.lineHeight = this.barHeight + this.barSpace;
		this.bottomSpace = BOTTOM_SPACE;

		this._adjustTimeLine();

		// adjust SVG element to given sizes
		this.svg = d3.select('#' + this.svgId)
			.attr('width', this.width + this.margin.left + this.margin.right)
			.attr('height', this.height + this.margin.top + this.margin.bottom);
		this.svg = this.svg
			.append('g')
				.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
	}

	_adjustTimeLine() {
		let minDate;
		let maxDate;
		this.height = this.lineHeight * this.data.length;

		// parse data text strings to JavaScript date stamps
		if (this.isDateOnlyFormat === null) {
			this.isDateOnlyFormat = true;
		}

		this.data.forEach((d) => {
			d.data.forEach((d1) => {
				if (!d1.origFromDate) {
					d1.origFromDate = d1[IDX_FROMDATE];
					d1.origToDate = d1[IDX_TODATE];

					if (DATE_RE.test(d1[IDX_FROMDATE])) { // date only data
						d1[IDX_FROMDATE] = Date.parse(d1[IDX_FROMDATE]);
					} else if (DATETIME_RE.test(d1[IDX_FROMDATE])) { // date and time data
						d1[IDX_FROMDATE] = Date.parse(d1[IDX_FROMDATE]);
						this.isDateOnlyFormat = false;
					} else {
						throw new Error('Date/time format (' + d1[IDX_FROMDATE] + ') not recognized. Pick between \'YYYY-MM-DD\' or ' +
							'\'YYYY-MM-DD HH:MM:SS\'.');
					}

					if (this.config.consecutive) {
						// start of next = end of before
						d1[IDX_TODATE] = d3.timeSecond.offset(d1[IDX_FROMDATE], d.interval_s);
					} else {
						if (DATE_RE.test(d1[IDX_TODATE])) { // date only data
							d1[IDX_TODATE] = Date.parse(d1[IDX_TODATE]);
						} else if (DATETIME_RE.test(d1[IDX_TODATE])) { // date and time data
							d1[IDX_TODATE] = Date.parse(d1[IDX_TODATE]);
							this.isDateOnlyFormat = false;
						} else {
							throw new Error('Date/time format (' + d1[IDX_TODATE] + ') not recognized. Pick between \'YYYY-MM-DD\' or ' +
								'\'YYYY-MM-DD HH:MM:SS\'.');
						}
					}
				}

				if (!this.config.timeSpan) {
					if (!minDate) {
						minDate = d1[IDX_FROMDATE];
						maxDate = d1[IDX_TODATE];
					} else {
						if (minDate > d1[IDX_FROMDATE]) {
							minDate = d1[IDX_FROMDATE];
						}
						if (maxDate < d1[IDX_TODATE]) {
							maxDate = d1[IDX_TODATE];
						}
					}
				}
			});
		});

		// no timespan given - thus take minimum and maximum date of dataset
		if (!this.config.timeSpan) {
			this.config.timeSpan = [];
			let d = this._getDate(new Date(minDate))
			this.config.timeSpan.push(`${d.y}-${d.m}-${d.d}`);
			d = this._getDate(new Date(maxDate))
			this.config.timeSpan.push(`${d.y}-${d.m}-${d.d}`);
		}

		// cluster data by dates to form time blocks
		this.data.forEach((series, index) => {
			const tmpData = [];
			const filteredData = series.data.filter((d) => {
				return d.origFromDate < this.config.timeSpan[IDX_XRANGE_END] && d.origToDate >= this.config.timeSpan[IDX_XRANGE_START];
			});
			const dataLength = filteredData.length;
			filteredData.forEach((d, i) => {
				if (i === 0) {
					tmpData.push(d);
				} else if (i < dataLength) {
					if (d[IDX_FROMDATE] === tmpData[tmpData.length - 1][IDX_FROMDATE]) {
						// the value has not changed since the last date
						if (this.config.consecutive) {
							tmpData[tmpData.length - 1][IDX_TODATE] = d[IDX_TODATE];
						} else {
							if (tmpData[tmpData.length - 1][IDX_TODATE] === d[IDX_FROMDATE]) { // last.TO === next.FROM
								tmpData[tmpData.length - 1][IDX_TODATE] = d[IDX_TODATE];
							} else {
								tmpData.push(d);
							}
						}
					} else {
						// the value has changed since the last date
						if (this.config.consecutive) {
							// extend last block until new block starts
							tmpData[tmpData.length - 1][IDX_TODATE] = d[IDX_FROMDATE];
						}
						tmpData.push(d);
					}
				}
			});
			this.data[index].disp_data = tmpData;
		});

		let startDate = this.displayDateRange[IDX_XRANGE_START];
		let endDate = this.displayDateRange[IDX_XRANGE_END];

		this.data.forEach((series) => {
			if (series.disp_data.length > 0) {
				const LAST_RECORD = series.disp_data.length - 1;
				if (startDate === 0) {
					startDate = series.disp_data[FIRST_RECORD][IDX_FROMDATE];
					endDate = series.disp_data[LAST_RECORD][IDX_TODATE];
				} else {
					if (this.displayDateRange[IDX_XRANGE_START] === 0 && series.disp_data[FIRST_RECORD][IDX_FROMDATE] < startDate) {
						startDate = series.disp_data[FIRST_RECORD][IDX_FROMDATE];
					}
					if (this.displayDateRange[IDX_XRANGE_END] === 0 && series.disp_data[LAST_RECORD][IDX_TODATE] > endDate) {
						endDate = series.disp_data[LAST_RECORD][IDX_TODATE];
					}
				}
			}
		});
		this.displayDateRange = [startDate, endDate];
	}

	_drawAxes() {
		// define scales and axes
		this.xScale = d3.scaleTime()
			.domain([
				this.displayDateRange[IDX_XRANGE_START] - ONEDAY, // -1 day to fix the yyyy-01-01 x-axis-timezone bug
				this.displayDateRange[IDX_XRANGE_END]
			])
			.range([0, this.width])
			.clamp(true);
		const xAxis = d3.axisTop().scale(this.xScale);

		// Quartal tick labels if period is longer than QUARTER_THRESHOLD
		if (this.displayDateRange[IDX_XRANGE_END] - this.displayDateRange[IDX_XRANGE_START] > QUARTER_THRESHOLD) {
			xAxis.tickFormat((t) => {
				// get the timestamp for the date + 1 day (to cover utc timezone offsets)
				const ts = new Date((t.getTime() + ONEDAY));
				// return appropriate quarter for the (zero-based) month
				switch (ts.getMonth()) {
					case 0: return ts.getFullYear();
					case 1: case 2: return 'Q1';
					case 3: case 4: case 5: return 'Q2';
					case 6: case 7: case 8: return 'Q3';
					default: return 'Q4';
				}
			});
		} else {
			xAxis.tickFormat((t) => {
				// formatting rule: yyyy-01-01 => yyyy | yyyy-mm-dd => mmm d
				if (!this._isYear(t)) {
					return `${MONTHS[t.getMonth()]} ${t.getDate()}`;
				}
				return t.getFullYear();
			});
		}

		// y axis (border and labels)
		const axes = this.svg.append('g').attr('id', 'axes');
		axes.append('g').attr('class', 'xAxis');
		axes.append('g').attr('class', 'yAxis');
		const domDefs = {};
		let lastDomain = null;
		this.data.forEach((d, i) => {
			let dm = d.measure;
			if (!dm) {
				dm = lastDomain;
			}
			lastDomain = dm;
			if (!domDefs[dm]) {
				domDefs[dm] = { label : d.measure, rows : 0, startRow: i }
			}
			domDefs[dm].rows++;
		});

		// domains on y axis
		const domains = this.svg.select('#axes .yAxis')
			.selectAll('g.domain')
				.data(Object.keys(domDefs))
				.enter()
					.append('g')
						.attr('class', 'domain');
		// y axis labels
		const labelWidth = this.margin.left;
		const bH = this.barHeight;
		const bH2 = bH >> 1;
		const bH4 = bH >> 2;

		// border
		domains
			.append('rect')
				.attr('class', 'ytitle')
				.attr('x', -this.margin.left)
				.attr('y', (d => { return this.lineHeight * domDefs[d].startRow + SPACE; }))
				.attr('width', this.margin.left - XGRIDLINE_OVERFLOW - SPACE)
				.attr('height', (d => { return (this.lineHeight * domDefs[d].rows - SPACE); }))
				.attr('rx', 4)
				.attr('ry', 4);
		// label
		domains
			.append('text')
				.attr('x', -this.margin.left)
				.attr('y', (d => { return this.lineHeight * domDefs[d].startRow + bH2 + bH4; }))
				.attr('dx', SPACE)
				.attr('dy', -SPACE)
				.attr('class', 'ytitle')
				.text(function (d) {
					let label = domDefs[d].label;
					if (!label) {
						return null;
					}
					const maxChars = labelWidth / 10; // rough rule: 10 chars per 100px
					if (maxChars >= label.length) {
						return label;
					}
					if (maxChars < 1) {
						return '';
					}
					return label.slice(0, maxChars - 1) + '…';
				});

		// horizontal grid lines
		if (this.config.gridlinesYaxis) {
			this.svg.select('#axes .yAxis').selectAll('line.yAxis')
				.data(this.data)
				.enter()
					.append('line')
						.attr('class', 'grid yAxis')
						.attr('x1', -XGRIDLINE_OVERFLOW)
						.attr('x2', XGRIDLINE_OVERFLOW + this.width)
						.attr('y1', ((d, i) => { return this.lineHeight * (i + 1) - bH2; }))
						.attr('y2', ((d, i) => { return this.lineHeight * (i + 1) - bH2; }));
		}

		// x axis
		if (this.data.length === 0) {
			return;
		}

		// vertical grid lines (on x-axis)
		if (this.config.gridlinesXaxis) {
			this.svg.select('#axes .xAxis').selectAll('line.xAxis')
				.data(this.xScale.ticks())
				.enter()
					.append('line')
						.attr('class', 'grid xAxis')
						.attr('x1', (d => { return this.xScale(d); }))
						.attr('x2', (d => { return this.xScale(d); }))
						.attr('y1', 0)
						.attr('y2', this.lineHeight * this.data.length + this.bottomSpace);
		}

		this.svg.select('#axes .xAxis').append('g').attr('class', 'ticks xTicks').call(xAxis);

		const xTicks = this.xScale.ticks();
		const isYearTick = xTicks.map(this._isYear);
		const isMonthTick = xTicks.map(this._isMonth);

		// style the time axis (x-axis) - year emphasis is only active if years are the biggest clustering unit
		if (!(isYearTick.every((d) => { return d === true; })) && isMonthTick.every((d) => { return d === true; })) {
			// emphasize year tick labels and year grid lines
			d3.selectAll('.tick').each(function (d, i) {
				d3.select(this).attr('class', ('tick' + (isYearTick[i] ? ' year ' : '')));
			});
			d3.selectAll('.grid.xAxis').each(function (d, i) {
				d3.select(this).attr('class', ('grid xAxis' + (isYearTick[i] ? ' year ' : '')));
			});
		}
	}

	_drawData() {
		this.svg.append('g').attr('id', 'data');

		// add rows of series and bars per serie
		let bars = this.svg.select('#data').selectAll('.serie')
			.data(this.data.slice(0, this.data.length))
			.enter()
				.append('g')
					.attr('transform', ((d, i) => { return 'translate(0,' + (this.lineHeight * i) + ')'; }))
					.attr('class', 'serie')
					.attr('row', ((d, i) => { return i; }))
				.selectAll('g.bar')
					.data((d) => { return d.disp_data; })
					.enter()
						.append('g')
						.attr('class', 'bar')
						.attr('x', (d => { return this.xScale(d[IDX_FROMDATE]); }))
						.on('mouseover', this._mouseOvered)
						.on('mouseout', this._mouseOuted);
		// draw the bars
		this._drawBars(bars);
	}

	_drawBars(bars) {
		const bH = this.barHeight;
		const bH2 = bH >> 1;
		const bH4 = bH >> 2;
		// add bar items: polygon - label - ellipse - info
		bars.append('polygon')
			.attr('x', (d => { return this._projectXStart(d); }))
			.attr('y', this.barSpace)
			.attr('w', (d => { return this._projectWidth(d); }))
			.attr('h', bH)
			.attr('points', (d) => {
				const isUnderflow = d[IDX_FROMDATE] < this.displayDateRange[IDX_XRANGE_START];
				const isOverflow = d[IDX_TODATE]    > this.displayDateRange[IDX_XRANGE_END];
				const x1 = this._projectXStart(d) - (isUnderflow ? XGRIDLINE_OVERFLOW * 2 / 3 : 0);
				const y1 = this.barSpace;
				const x2 = this._projectXEnd(d);
				const y2 = y1;
				const x3 = x2 + (isOverflow ? XGRIDLINE_OVERFLOW * 2 / 3 : 0);
				const y3 = y2 + bH;
				const x4 = this._projectXStart(d);
				const y4 = y3;
				return `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;
			})
			.attr('class', (d => {
				return  'bar'
					+ (d[IDX_FROMDATE] < this.displayDateRange[IDX_XRANGE_START] ? ' underflow' : '')
					+ (d[IDX_TODATE]   > this.displayDateRange[IDX_XRANGE_END]   ? ' overflow'  : '');
			}))
			.style('fill', (d) => {
				return this._getBarColor(d[IDX_CATEGORY]);
			})
			.style('stroke', (d) => {
				if (!this.config.bar.border) {
					return null;
				}
				return this._getStrokeColor(d[IDX_CATEGORY])
			})
			.style('stroke-width', (d) => {
				if (!this.config.bar.border) {
					return null;
				}
				return BAR_STROKEWIDTH;
			});
		// add bar label
		bars.append('text')
			.attr('x', (d => { return this._projectXStart(d); }))
			.attr('y', 0)
			.attr('width', (d => { return this._projectWidth(d); }))
			.attr('height', bH)
			.attr('class', 'barlabel')
			.text((d) => {
				let label = d[IDX_LABEL];
				if (!label) {
					return null;
				}
				let width = this._projectWidth(d);
				const maxChars = width / 12;
				const len = d[IDX_LABEL].length;
				if (maxChars >= len) {
					return d[IDX_LABEL];
				}
				if (maxChars < 1) {
					return '';
				}
				return d[IDX_LABEL].slice(0, maxChars - 1) + '…';
			})
			.attr('dominant-baseline', 'baseline')
			.attr('dx', SPACE)
			.attr('dy', this.lineHeight - bH4)
			.style('fill', (d) => {
				return this._getTextColor(d[IDX_CATEGORY]);
			});

		// add bar info ellipse
		bars.append('ellipse')
			.attr('class', (d => {
				return 'barellipse' + (!d[IDX_INFO] || this._projectWidth(d) < MIN_BARWIDTH ? ' empty' : '');
			}))
			.attr('cx', (d => { return this._projectXStart(d); }))
			.attr('cy', 0)
			.attr('rx', (d => { return 15 + 3 * (d[IDX_INFO] === undefined ? 0 : ('' + d[IDX_INFO]).length); }))
			.attr('ry', (bH - SPACE) >> 1)
			.attr('x', (d => { return this._projectXStart(d); }))
			.attr('y', 0)
			.attr('transform', (d => {
				return `translate(
					${this._projectWidth(d) - (18 + 3 * (d[IDX_INFO] === undefined ? 0 : ('' + d[IDX_INFO]).length))},
					${bH2 + bH4})`;
			}));
		// add bar info text
		bars.append('text')
				.attr('x', (d => { return this._projectXStart(d); })) // tooltip x pos
				.attr('y', bH2 + bH4)
				.attr('dx', (d => { return this._projectWidth(d) - SPACE; })) // text x pos
				.attr('class', (d => {
					return d[IDX_INFO] && this._projectWidth(d) > MIN_BARWIDTH ? 'barinfo' : 'empty';
				}))
				.attr('text-anchor', 'end')
				.text(d => { return d[IDX_INFO]; })
				.style('fill', (d => { return this._getTextColor(d[IDX_CATEGORY]); }));
	}

	_renderTooltip(d) {
		d3.select('#' + this.tooltipId).selectAll('*').remove();

		// title: label and timespan
		let div = this.tooltipDiv.append('div').attr('class', 'title')
		div.append('div').attr('class', 'name').text(d[IDX_LABEL] || 'n.a.');
		if (this.config.consecutive) {
			if (d.origFromDate !== null) {
				div.append('div').attr('class', 'date').text(d.origFromDate);
			}
		} else {
			if (d.origFromDate !== null && d.origToDate !== null) {
				div.append('div').attr('class', 'date').text(`${d.origFromDate} - ${d.origToDate}`);
			}
		}

		// info
		div = this.tooltipDiv.append('div').attr('class', 'info')
		div.append('span').attr('class', 'key').text(this.config.infoLabel);
		div.append('span').text((d[IDX_INFO]) || 'n.a.');

		// load - if any
		if (d[IDX_LOAD]) {
			const load = this.tooltipDiv.append('div').attr('class', 'load')
			// load is an object and will be rendered as a key-value-list
			Object.keys(d[IDX_LOAD]).forEach((k) => {
				const kv = load.append('div').attr('class', 'keyvalue');
				kv.append('span').attr('class', 'key').text(k);
				kv.append('span').attr('class', 'value').text(d[IDX_LOAD][k]);
			});
		}
	}

	_isYear(t) {
		return +t ===  + (new Date(t.getFullYear(), 0, 1, 0, 0, 0));
	}

	_isMonth(t) {
		return +t ===  + (new Date(t.getFullYear(), t.getMonth(), 1, 0, 0, 0));
	}

	_getDate(date) {
		date = date || new Date();
		const d = date.getDate();
		const m = date.getMonth() + 1;
		const H = date.getHours();
		const M = date.getMinutes();
		const S = date.getSeconds();
		return {
				y: date.getFullYear(),
				m: (m < 10 ? '0' + m : m),
				d: (d < 10 ? '0' + d : d),
				H: (H < 10 ? '0' + H : H),
				M: (M < 10 ? '0' + M : M),
				S: (S < 10 ? '0' + S : S)
		};
	}

	_projectXStart(data) {
		return this.xScale(data[IDX_FROMDATE]);
	}
	_projectXEnd(data) {
		return this.xScale(data[IDX_TODATE]);
	}
	_projectWidth(data) {
		return this.xScale(data[IDX_TODATE]) - this.xScale(data[IDX_FROMDATE]);
	}

	_getBarColor(cat) {
		if (this.categories[cat]) {
			return this.categories[cat].barColor;
		}
		return this.categories[DEFAULT_CATEGORY].barColor;
	}
	_getTextColor(cat) {
		if (this.categories[cat]) {
			return this.categories[cat].textColor;
		}
		return this.categories[DEFAULT_CATEGORY].textColor;
	}
	_getStrokeColor(cat) {
		if (this.categories[cat] && this.categories[cat].strokeColor) {
			return this.categories[cat].strokeColor;
		}
		return d3.rgb(this._getBarColor(cat)).darker();
	}

	display(data, categories, config) {
		this.data = data;
		// extract and adjust categories

		this.categories = {};
		this.categories[DEFAULT_CATEGORY] = {
			barColor: DEFAULT_BARCOLOR,
			textColor: DEFAULT_TEXTCOLOR
		};
		if (categories) {
			Object.keys(categories).forEach((k) => {
				const v = categories[k];
				this.categories[k] = {
					barColor:    v && v.barColor  || DEFAULT_BARCOLOR,
					textColor:   v && v.textColor || DEFAULT_TEXTCOLOR,
					strokeColor: v.strokeColor
				};
			});
		}

		// extract chart configuration
		this.config = CHARTCONFIG_DEFAULT;
		if (config) {
			Object.keys(config).forEach((k) => {
				const v = config[k];
				if (v !== null && v !== undefined) {
					this.config[k] = v;
				}
			});
		}

		// div for tooltip
		if (!this.tooltipDiv) {
			this.tooltipDiv = d3.select('#' + this.componentId)
				.append('div')
					.attr('id', this.tooltipId)
					.attr('class', 'tooltip')
					.style('opacity', 0.0);
		}

		// SVG element
		if (!this.svg) {
			this.svg = d3.select('#' + this.componentId)
				.append('svg')
					.attr('id', this.svgId);
		} else {
			d3.select('#' + this.svgId).selectAll('*').remove();
		}

		if (this.data) {
			this._drawChart();
		}
	}

	destroy() {
		if (this.chart) {
			this.chart.destroy();
		}
	}
}

export default D3RoadmapChart;
