import * as d3 from 'd3';

const FIRST_RECORD = 0;
const IDX_XRANGE_START = 0;
const IDX_XRANGE_END = 1;
const ONEDAY = 24 * 60 * 60 * 1000;

const IDX_CATEGORY = 0;
const IDX_FROMDATE = 1;
const IDX_TODATE = 2;
const IDX_LABEL = 3;
const IDX_INFO = 4;
const IDX_LOAD = 5;

const MARGIN_TOP_WITHOUT_TITLE = 20; // 20 px for x-axis labels
const MARGIN_TOP_WITH_TITLE = MARGIN_TOP_WITHOUT_TITLE + 30; // add another 30px for title (a single line)
const MARGIN_RIGHT = 40; // right margin should provide space for last horz. axis title
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 120; // left margin should provide space for y axis titles

const BOTTOM_SPACE = 10; // vertical overhang of vertical grid lines on bottom
const XGRIDLINE_OVERFLOW = 30; // x-axis gridline will overflow the current chart width by this length (on both sides)
const DEFAULT_BARHEIGHT = 24;

const DEFAULT_LABELYWIDTH = MARGIN_LEFT; // space fo y-axis labels

const CHARTCONFIG_DEFAULT = {
	title: null,
	timeSpan: null,
	consecutive: false,
	gridlinesXaxis: true,
	gridlinesYaxis: true,
	infoLabel: 'Information',
	barHeight: DEFAULT_BARHEIGHT,
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

	_mouseOvered(d) {
		const target = d3.event.target;
		const svg = document.getElementById(this.svgId);
		const targetX = +target.attributes['x'].value;

		// check parents for row number (1st parent holds row number)
		let rowNum = null;
		let pn = target.parentNode;
		while (!rowNum && pn && pn !== svg) {
			rowNum = pn.attributes['row'].value;
			pn = pn.parentNode;
		}
		// tooltip positionieren!
		rowNum = 1 + (rowNum ? 1 * rowNum : 0);
		const tooltip = {
				left: this.margin.left + targetX + 12,
				top:  this.margin.top - this.titleSpace + (rowNum + 0.25) * this.lineHeight
		};

		tooltip.left = tooltip.left > this.width - 100 ? this.width - 100 : tooltip.left;
		this._renderTooltip(d);
		this.tooltipDiv
			.style('top', tooltip.top + 'px')
			.style('left', tooltip.left + 'px')
			.transition().duration(500).style('opacity', 1.0);
	}

	_mouseOuted() {
		this.tooltipDiv.transition().duration(500).style('opacity', 0.0);
	}

	_drawChart() {
		this._adjustChart();
		this._drawTitle();
		this._drawAxes();
		this._drawData()
	}

	_adjustChart() {
		// adjust margin-top depending on title
		this.renderTitle = this.config.title && this.config.title.length > 0;

		this.margin = {
			top: (this.renderTitle ? MARGIN_TOP_WITH_TITLE : MARGIN_TOP_WITHOUT_TITLE),
			left: this.config.labelYwidth || DEFAULT_LABELYWIDTH,
			bottom: MARGIN_BOTTOM,
			right: MARGIN_RIGHT
		};

		// the chart's netto width
		this.component = this.component || document.getElementById(this.componentId);
		this.width = this.component.parentElement.clientWidth - this.margin.left - this.margin.right;

		// range of dates that will be shown
		// if from-date (1st element) or to-date (2nd element) is zero,
		// it will be determined according to the min- and max-times within the dataset (default: automatically)
		if (this.config.timeSpan && this.config.timeSpan.length > 1) {
			this.displayDateRange = [Date.parse(this.config.timeSpan[IDX_XRANGE_START]), Date.parse(this.config.timeSpan[IDX_XRANGE_END])];
		} else {
			this.displayDateRange = [0,0];
		}

		this.isDateOnlyFormat = null; // used date/time format (yyyy-mm-dd or yyyy-mm-dd HH:MM:SS)

		this.barHeight = this.config.barHeight; // height and vertical space of horizontal data bars
		this.barSpace = this.barHeight / 4;
		this.lineHeight = this.barHeight + this.barSpace;

		this.titleSpace = MARGIN_TOP_WITHOUT_TITLE - MARGIN_TOP_WITH_TITLE; // negative value!
		this.bottomSpace = BOTTOM_SPACE;

		this._adjustTimeLine();

		// adjust SVG element to given sizes
		this.svg = d3.select('#' + this.svgId)
			.attr('width', this.width + this.margin.left + this.margin.right)
			.attr('height', this.height + this.margin.top + this.margin.bottom)
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

		const axes = this.svg.append('g').attr('id', 'axes');
		axes.append('g').attr('class', 'xAxis');
		axes.append('g').attr('class', 'yAxis');

		// y axis
		const labels = this.svg.select('#axes .yAxis').selectAll('text')
			//.data(this.data.slice(startSet, endSet))
			.data(this.data.slice(0, this.data.length))
			.enter();

		// y axis labels
		const me = this;
		labels.append('text')
			.attr('x', -this.margin.left)
			.attr('y', this.barSpace + this.barHeight / 2)
			.attr('class', 'ytitle')
			.text(function (d) {
				let label = d.measure;
				if (!label) {
					return null;
				}
				const maxChars = me.margin.left / 10;
				if (maxChars >= label.length) {
					return label;
				}
				if (maxChars < 1) {
					return '';
				}
				return label.slice(0, maxChars - 1) + '…';
			})
			.attr('transform', ((d, i) => { return 'translate(0,' + (this.lineHeight * i) + ')'; }));

		// vertical grid lines (on x-axis)
		if (this.data.length > 0 && this.config.gridlinesXaxis) {
			this.svg.select('#axes .xAxis').selectAll('line.grid_xAxis')
				.data(this.xScale.ticks())
				.enter()
					.append('line')
						.attr('class', 'grid grid_xAxis')
						.attr('x1', (d => { return this.xScale(d); }))
						.attr('x2', (d => { return this.xScale(d); }))
						.attr('y1', 0)
						.attr('y2', this.lineHeight * this.data.length + this.bottomSpace);
		}

		// horizontal grid lines (on y-axis)
		if (this.config.gridlinesYaxis) {
			this.svg.select('#axes .yAxis').selectAll('line.grid_yAxis')
				.data(this.data)
				.enter()
					.append('line')
						.attr('class', 'grid grid_yAxis')
						.attr('x1', -XGRIDLINE_OVERFLOW)
						.attr('x2', XGRIDLINE_OVERFLOW + this.width)
						.attr('y1', ((d, i) => { return this.lineHeight * (i + 1) - this.barHeight / 2; }))
						.attr('y2', ((d, i) => { return this.lineHeight * (i + 1) - this.barHeight / 2; }));
		}

		// x axis
		if (this.data.length > 0) {
			this.svg.select('#axes .xAxis').append('g').attr('class', 'ticks xTicks').call(xAxis);
		}

		const xTicks = this.xScale.ticks();
		const isYearTick = xTicks.map(this._isYear);
		const isMonthTick = xTicks.map(this._isMonth);

		// style the time axis (x-axis) - year emphasis is only active if years are the biggest clustering unit
		if (!(isYearTick.every((d) => { return d === true; })) && isMonthTick.every((d) => { return d === true; })) {
			d3.selectAll('.tick').each(function (d, i) {
				d3.select(this).attr('class', ('tick' + (isYearTick[i] ? ' year' : '')));
			});
			d3.selectAll('.grid_xAxis').each(function (d, i) {
				d3.select(this).attr('class', ('grid grid_xAxis' + (isYearTick[i] ? ' year' : '')));
			});
		}
	}

	_drawData() {
		this.svg.append('g').attr('id', 'data');

		// make y-axis bar groups for different data series
		let chartRow = this.svg.select('#data').selectAll('.serie')
			.data(this.data.slice(0, this.data.length))
			.enter()
				.append('g')
					.attr('transform', ((d, i) => { return 'translate(0,' + (this.lineHeight * i) + ')'; }))
					.attr('class', 'serie')
					.attr('row', ((d, i) => { return i; }));

		// add data series (bar groups)
		chartRow.selectAll('.serie g')
			.data((d) => { return d.disp_data; })
			.enter()
				.append('g')
				.attr('class', 'bar')
				.attr('x', (d => { return this.xScale(d[IDX_FROMDATE]); }));
		// add data series (bar polygons)
		chartRow.selectAll('.serie g.bar polygon')
			.data((d) => { return d.disp_data; })
			.enter()
				.append('polygon')
					.attr('x', (d => { return this.xScale(d[IDX_FROMDATE]); }))
					.attr('y', this.barSpace)
					.attr('w', (d => { return (this.xScale(d[IDX_TODATE]) - this.xScale(d[IDX_FROMDATE])); }))
					.attr('h', this.barHeight)
					.attr('points', (d) => {
						const isUnderflow = d[IDX_FROMDATE] < this.displayDateRange[IDX_XRANGE_START];
						const isOverflow = d[IDX_TODATE]    > this.displayDateRange[IDX_XRANGE_END];
						const x1 = this.xScale(d[IDX_FROMDATE]) - (isUnderflow ? XGRIDLINE_OVERFLOW : 0);
						const y1 = this.barSpace;
						const x2 = this.xScale(d[IDX_TODATE]);
						const y2 = y1;
						const x3 = x2 + (isOverflow ? XGRIDLINE_OVERFLOW : 0);
						const y3 = y2 + this.barHeight;
						const x4 = this.xScale(d[IDX_FROMDATE]);
						const y4 = y3;
						return `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`;
					})
					.attr('class', (d) => {
						return 'bar'
							+ (d[IDX_FROMDATE] < this.displayDateRange[IDX_XRANGE_START] ? ' underflow' : '')
							+ (d[IDX_TODATE]   > this.displayDateRange[IDX_XRANGE_END]   ? ' overflow'  : '');
					})
					.style('fill', (d) => {
						return this.categories[d[IDX_CATEGORY]].barColor;
					})
					.on('mouseover', this._mouseOvered)
					.on('mouseout', this._mouseOuted);
		// add bar labels
		chartRow.selectAll('.serie g.bar text.label')
			.data((d) => { return d.disp_data; })
			.enter()
				.append('text')
					.attr('x', (d => { return this.xScale(d[IDX_FROMDATE]); }))
					.attr('y', 0)
					.attr('width', (d => { return (this.xScale(d[IDX_TODATE]) - this.xScale(d[IDX_FROMDATE])); }))
					.attr('height', this.barHeight)
					.attr('class', 'label')
					.text((d) => {
						let label = d[IDX_LABEL];
						if (!label) {
							return null;
						}
						let width = this.xScale(d[IDX_TODATE]) - this.xScale(d[IDX_FROMDATE]);
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
					.attr('dx', 2)
					.attr('dy', this.lineHeight - this.barHeight / 4)
					.style('fill', (d) => {
						return this.categories[d[IDX_CATEGORY]].textColor;
					})
					.on('mouseover', this._mouseOvered)
					.on('mouseout', this._mouseOuted);

		// add bar info
		chartRow.selectAll('.serie g.bar text.info')
			.data((d) => { return d.disp_data; })
			.enter()
				.append('text')
					.attr('x', (d => { return this.xScale(d[IDX_FROMDATE]); }))
					.attr('y', 0)
					.attr('width', 30)
					.attr('height', this.barHeight)
					.attr('class', 'info')
					.text((d) => {
						if (!d[IDX_INFO] || this.xScale(d[IDX_TODATE]) - this.xScale(d[IDX_FROMDATE]) < 100) {
							return null;
						}
						return d[IDX_INFO];
					})
					.attr('dominant-baseline', 'top')
					.attr('text-anchor', 'end')
					.attr('dx', (d => { return (this.xScale(d[IDX_TODATE]) - this.xScale(d[IDX_FROMDATE])) - 4; }))
					.attr('dy', this.barHeight / 2 + 4)
					.style('fill', (d) => {
						return this.categories[d[IDX_CATEGORY]].textColor;
					})
					.on('mouseover', this._mouseOvered)
					.on('mouseout', this._mouseOuted);
	}

	_drawTitle() {
		if (this.renderTitle) {
			// create chart title
			const header = this.svg.append('g').attr('id', 'g_title');
			header.append('text')
				.attr('x', -this.margin.left)
				.attr('y', this.titleSpace)
				.attr('class', 'heading')
				.text(this.config.title);
		}
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
			div = this.tooltipDiv.append('div').attr('class', 'load')
			// load is an object and will be rendered as a key-value-list
			Object.keys(d[IDX_LOAD]).forEach((k) => {
				div = div.append('div').attr('class','keyvalue');
				div.append('span').attr('class', 'key').text(k);
				div.append('span').attr('class', 'value').text(d[IDX_LOAD][k]);
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

	display(data, categories, config) {
		this.data = data;
		this.categories = categories;

		// extract chart configuration
		this.config = CHARTCONFIG_DEFAULT;
		if (config) {
			Object.keys(this.config).forEach((k) => {
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
				.append('svg').attr('id', this.svgId);
		} else {
			d3.select('#' + this.svgId).selectAll('*')
				.remove();
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
