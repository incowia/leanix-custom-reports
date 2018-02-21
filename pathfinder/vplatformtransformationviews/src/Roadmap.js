import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';

const FIRST_RECORD = 0;
const IDX_XRANGE_START = 0;
const IDX_XRANGE_END = 1;

const IDX_CATEGORY = 0;
const IDX_FROMDATE = 1;
const IDX_TODATE = 2;
const IDX_LABEL = 3;
const IDX_INFO = 4;
const IDX_PAYLOAD = 5;

const MARGIN_TOP_WITH_TITLE = 70; // top margin includes title and legend
const MARGIN_RIGHT = 40; // right margin should provide space for last horz. axis title
const MARGIN_BOTTOM = 10;
const MARGIN_LEFT = 120; // left margin should provide space for y axis titles

// default chart configuration, if no config has been delivered
const CHARTCONFIG_DEFAULT = {
	title: null,
	timeSpan: null,
	consecutive: false,
	gridlineX: true,
	gridlineY: true,
	infoLabel: 'Information'
};

const DATE_RE = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
const DATETIME_RE = new RegExp(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

class Roadmap extends Component {

	constructor(props) {
		super(props);
		this.state = {};

		this.componentId = 'roadmap';
		this.component = null;
		this.config = CHARTCONFIG_DEFAULT;

		this.margin = {
			top: MARGIN_TOP_WITH_TITLE,
			right: MARGIN_RIGHT,
			bottom: MARGIN_BOTTOM,
			left: MARGIN_LEFT
		};

		// height of horizontal data bars
		this.barHeight = 20;
		// spacing between horizontal data bars
		this.lineSpacing = 4;
		this.lineHeight = this.barHeight + this.lineSpacing;

		// vertical space for heading
		this.paddingTopHeading = -50;
		// vertical overhang of vertical grid lines on bottom
		this.paddingBottom = 10;
		// space for y axis titles
		this.paddingLeft = -MARGIN_LEFT;

		// x-axis gridline will overflow the current chart width by this length (on both sides)
		this.gridLinePadding = 20;

		this.width = 940 - MARGIN_LEFT - MARGIN_RIGHT;

		// range of dates that will be shown
		// if from-date (1st element) or to-date (2nd element) is zero,
		// it will be determined according to your data (default: automatically)
		this.displayDateRange = [0, 0];

		this.isDateOnlyFormat = null;

		this.tooltipDiv = null;
		this.svg = null;

		this._drawChart = this._drawChart.bind(this);
		this._mouseOvered = this._mouseOvered.bind(this);
		this._mouseOuted = this._mouseOuted.bind(this);
	}

	componentDidMount() {
		// div for tooltip
		this.tooltipDiv = d3.select('#' + this.componentId)
			.append('div')
				.attr('id', this.componentId + '_tooltip')
				.attr('class', 'tooltip')
				.style('opacity', 0.0);
		// SVG element
		this.svg = d3.select('#' + this.componentId)
			.append('svg')
				.attr('id', `${this.componentId}_svg`);
	}

	_mouseOvered(d) {
		const target = d3.event.target;
		const svg = document.getElementById(`${this.componentId}_svg`);
		const targetX = +target.attributes['x'].value;
		const targetY = +target.attributes['y'].value;

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
				left: this.margin.left + targetX + 24,
				top:  this.margin.top - this.paddingTopHeading + (rowNum + 0.5) * this.lineHeight
		};

		tooltip.left = tooltip.left > this.width - 100 ? this.width - 100 : tooltip.left;
		this.tooltipDiv
			.html(this._renderTooltip(d))
			.style('top', tooltip.top + 'px')
			.style('left', tooltip.left + 'px')
			.transition()
				.duration(500)
				.style('opacity', 1.0);
	}

	_mouseOuted() {
		this.tooltipDiv.transition()
			.duration(500)
			.style('opacity', 0.0);
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

	_drawChart(selection) {

		// extract chart configuration
		if (this.props.config) {
			Object.keys(this.props.config).forEach((k) => {
				const v = this.props.config[k];
				this.config[k] = v === null || v === undefined ? CHARTCONFIG_DEFAULT[k] : v;
			});
		}

		// adjust chart width to parent element width
		this.width = this.component.parentElement.clientWidth - this.margin.left - this.margin.right;

		// adjust margin-top depending on title
		const drawTitle = this.config.title && this.config.title.length > 0;
		this.margin.top = (drawTitle ? MARGIN_TOP_WITH_TITLE : 20);

		if (this.config.timeSpan && this.config.timeSpan.length > 1) {
			this.displayDateRange = [Date.parse(this.config.timeSpan[IDX_XRANGE_START]), Date.parse(this.config.timeSpan[IDX_XRANGE_END])];
		} else {
			this.displayDateRange = [0,0];
		}

		let minDate;
		let maxDate;
		selection.each((dataset) => {
			const noOfDatasets = dataset.length;
			const height = this.lineHeight * noOfDatasets;

			// parse data text strings to JavaScript date stamps
			if (this.isDateOnlyFormat === null) {
				this.isDateOnlyFormat = true;
			}

			dataset.forEach((d) => {
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
			dataset.forEach((series, index) => {
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
				dataset[index].disp_data = tmpData;
			});

			// determine start and end dates among all nested datasets
			let startDate = this.displayDateRange[IDX_XRANGE_START];
			let endDate = this.displayDateRange[IDX_XRANGE_END];

			dataset.forEach((series) => {
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

			this.displayDateRange = [startDate, endDate]

			// define scales
			const xScale = d3.scaleTime()
				.domain([startDate - 24 * 60 * 60 * 1000, endDate]) // -1 day to fix the yyyy-01-01 x-axis-problem (timezones)
				.range([0, this.width])
				.clamp(true);

			// define axes
			const xAxis = d3.axisTop().scale(xScale);

			// adjust SVG element to given sizes
			this.svg = d3.select('#' + this.componentId + '_svg')
				.attr('width', this.width + this.margin.left + this.margin.right)
				.attr('height', height + this.margin.top + this.margin.bottom)
				.append('g')
					.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

			// create basic element groups (axes and data)
			this.svg.append('g').attr('id', 'g_axis');
			this.svg.append('g').attr('id', 'g_data');

			// y axis
			const labels = this.svg.select('#g_axis').selectAll('text')
				//.data(dataset.slice(startSet, endSet))
				.data(dataset.slice(0, noOfDatasets))
				.enter();

			// y axis labels
			labels.append('text')
				.attr('x', this.paddingLeft)
				.attr('y', this.lineSpacing + this.barHeight / 2)
				.attr('class', 'ytitle')
				.text(function (d) { return d.measure; })
				.attr('transform', ((d, i) => { return 'translate(0,' + (this.lineHeight * i) + ')'; }));

			// vertical grid lines
			if (noOfDatasets && this.config.gridlineY) {
				this.svg.select('#g_axis').selectAll('line.vertical_grid')
					.data(xScale.ticks())
					.enter()
						.append('line')
							.attr('class', 'vertical_grid')
							.attr('x1', (d => { return xScale(d); }))
							.attr('x2', (d => { return xScale(d); }))
							.attr('y1', 0)
							.attr('y2', this.lineHeight * noOfDatasets + this.paddingBottom);
			}
			// horizontal grid lines
			if (this.config.gridlineX) {
				this.svg.select('#g_axis').selectAll('line.horizontal_grid')
					.data(dataset)
					.enter()
						.append('line')
							.attr('class', 'horizontal_grid')
							.attr('x1', -this.gridLinePadding)
							.attr('x2', this.gridLinePadding + this.width)
							.attr('y1', ((d, i) => { return this.lineHeight * (i + 0.5); }))
							.attr('y2', ((d, i) => { return this.lineHeight * (i + 0.5); }));
			}

			// x axis
			if (noOfDatasets) {
				this.svg.select('#g_axis').append('g')
					.attr('class', 'ticks')
					.call(xAxis);
			}

			// make y-axis groups for different data series
			const chartRow = this.svg.select('#g_data').selectAll('.dataset')
				.data(dataset.slice(0, noOfDatasets))
				.enter()
					.append('g')
						.attr('transform', ((d, i) => { return 'translate(0,' + (this.lineHeight * i) + ')'; }))
						.attr('class', 'dataset')
						.attr('row', ((d, i) => { return i; }));

			// add data series (bars)
			chartRow.selectAll('rect')
				.data((d) => { return d.disp_data; })
				.enter()
					.append('rect')
						.attr('x', (d => { return xScale(d[IDX_FROMDATE]); }))
						.attr('y', this.lineSpacing)
						.attr('width', (d => { return (xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE])); }))
						.attr('height', this.barHeight)
						.attr('class', 'bar')
						.style('fill', (d) => {
							return this.props.categories[d[IDX_CATEGORY]].barColor;
						})
						.on('mouseover', this._mouseOvered)
						.on('mouseout', this._mouseOuted);

			// add bar labels
			chartRow.selectAll('text.label')
				.data((d) => { return d.disp_data; })
				.enter()
					.append('text')
						.attr('x', (d => { return xScale(d[IDX_FROMDATE]); }))
						.attr('y', 0)
						.attr('width', (d => { return (xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE])); }))
						.attr('height', this.barHeight)
						.attr('class', 'label')
						.text((d) => {
							let label = d[IDX_LABEL];
							if (!label) {
								return null;
							}
							let width = xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE]);
							const maxChars = width / 12;
							const len = d[IDX_LABEL].length;
							if (maxChars < len) {
								return d[IDX_LABEL].slice(0, maxChars - 1) + '…';
							} else {
								return d[IDX_LABEL];
							}
						})
						.attr('dominant-baseline', 'baseline')
						.attr('dx', 2)
						.attr('dy', this.lineHeight - this.barHeight / 4)
						.style('fill', (d) => {
							return this.props.categories[d[IDX_CATEGORY]].textColor;
						})
						.on('mouseover', this._mouseOvered)
						.on('mouseout', this._mouseOuted);

			// add bar info
			chartRow.selectAll('text.info')
				.data((d) => { return d.disp_data; })
				.enter()
					.append('text')
						.attr('x', (d => { return xScale(d[IDX_FROMDATE]); }))
						.attr('y', 0)
						.attr('width', 30)
						.attr('height', this.barHeight)
						.attr('class', 'info')
						.text((d) => {
							if (!d[IDX_INFO] || xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE]) < 100) {
								return null;
							}
							return d[IDX_INFO];
						})
						.attr('dominant-baseline', 'baseline')
						.attr('text-anchor', 'end')
						.attr('dx', (d => { return (xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE])) - 4; }))
						.attr('dy', this.lineHeight - this.barHeight / 4)
						.style('fill', (d) => {
							return this.props.categories[d[IDX_CATEGORY]].textColor;
						})
						.on('mouseover', this._mouseOvered)
						.on('mouseout', this._mouseOuted);

			const xTicks = xScale.ticks();
			const isYearTick = xTicks.map(this._isYear);
			const isMonthTick = xTicks.map(this._isMonth);

			// style the time axis (x-axis) - year emphasis is only active if years are the biggest clustering unit
			if (!(isYearTick.every((d) => { return d === true; })) && isMonthTick.every((d) => { return d === true; })) {
				d3.selectAll('g.tick').each(function (d, i) {
					d3.select(this).attr('class', ('x_tick' + (isYearTick[i] ? ' year' : '')));
				});
				d3.selectAll('.vertical_grid').each(function (d, i) {
					d3.select(this).attr('class', ('vertical_grid' + (isYearTick[i] ? ' year' : '')));
				});
			}
		});

		if (drawTitle) {
			// create chart title
			const header = this.svg.append('g').attr('id', 'g_title');
			header.append('text')
				.attr('x', this.paddingLeft)
				.attr('y', this.paddingTopHeading)
				.attr('class', 'heading')
				.text(this.config.title);
		}
	}

	_renderTooltip(d) {
		// display y-axis label and all the other stuff
		let output = '';
		output += `<div class='title'>`;
			// label
			output += `<span class='label'>${d[IDX_LABEL] || 'n.a.'}</span>`;
			// timespan
			if (this.config.consecutive) {
				if (d.origFromDate !== null) {
					output += ` (<span class='date'>${d.origFromDate}</span>)`;
				}
			} else {
				if (d.origFromDate !== null && d.origToDate !== null) {
					output += ` (from `;
					output += `<span class='date'>${d.origFromDate}</span>`;
					output += ` to `;
					output += `<span class='date'>${d.origToDate}</span>)</div>`;
				}
			}
		output += '</div>';
		// info
		output += `<div class='info'><span class='key'>${this.config.infoLabel}:</span> ${(d[IDX_INFO]) || 'n.a.'}</div>`;
		// payload - if any
		if (d[IDX_PAYLOAD]) {
			output += `<div class='payload'>`;
			Object.keys(d[IDX_PAYLOAD]).forEach((k) => {
				output += `<div class='keyvalue'><span class='key'>${k}:</span><span class='value'>${d[IDX_PAYLOAD][k]}</span></div>`;
			});
			output += '</div>';
		}
		return output;
	}

	render() {
		// TODO: the chart will NOT shown on 1st render (componentDidMount not yet fired)!
		this.component = this.component || document.getElementById(this.componentId);
		if (!this.component) {
			console.error('ERR: No roadmap component found!');
			return (<div id={this.componentId}/>);
		}

		// redraw chart
		d3.select('#' + this.componentId + '_svg').selectAll('*').remove();
		d3.select('#' + this.componentId).datum(this.props.data).call(this._drawChart);
		return (
			<div id={this.componentId}/>
		);
	}
}

Roadmap.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			measure: PropTypes.string,
			data: PropTypes.arrayOf(
				PropTypes.arrayOf(
					PropTypes.oneOfType([
						PropTypes.string,
						PropTypes.number,
						PropTypes.shape()
					])).isRequired
			)
		}).isRequired
	),
	categories: PropTypes.shape(),
	config: PropTypes.shape({
		title: PropTypes.string,
		timeSpan: PropTypes.arrayOf(PropTypes.string.isRequired, PropTypes.string.isRequired),
		consecutive: PropTypes.bool,
		gridlineX: PropTypes.bool,
		gridlineY: PropTypes.bool,
		infoLabel: PropTypes.string
	})
};

export default Roadmap;
