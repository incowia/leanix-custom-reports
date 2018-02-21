import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import moment from 'moment';

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
const MARGIN_LEFT = 150; // left margin should provide space for y axis titles

const DATE_RE = new RegExp(/^\d{4}-\d{2}-\d{2}$/);
const DATETIME_RE = new RegExp(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

const TRANSLATIONS = {
	'en': {
		FROM: 'from',
		TO: 'to',
		M: ['1','2','3','4','5','6','7','8','9','10','11','12'],
		MM: ['01','02','03','04','05','06','07','08','09','10','11','12'],
		MMM: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
		MMMM: ['January','February','March','April','May','June','July','August','September','October','November','December'],
		FORMATTED: 'YYYY/MM/DD'
	},
	'de': {
		FROM: 'von',
		TO: 'bis',
		M: ['1','2','3','4','5','6','7','8','9','10','11','12'],
		MM: ['01','02','03','04','05','06','07','08','09','10','11','12'],
		MMM: ['Jan','Feb','Mar','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'],
		MMMM: ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'],
		FORMATTED: 'DD.MM.YYYY'
	}
};

class Roadmap extends Component {

	constructor(props) {
		super(props);
		this.state = {};

		this.componentId = 'roadmap';
		this.component = null;

		this.trans = TRANSLATIONS['en'];

		this.margin = {
			top: MARGIN_TOP_WITH_TITLE,
			right: MARGIN_RIGHT,
			bottom: MARGIN_BOTTOM,
			left: MARGIN_LEFT
		};

		// height of horizontal data bars
		this.barHeight = 24;

		// spacing between horizontal data bars
		this.lineSpacing = 4;

		this.lineHeight = this.barHeight + this.lineSpacing;

		// vertical space for heading
		this.paddingTopHeading = -50;

		// vertical overhang of vertical grid lines on bottom
		this.paddingBottom = 10;

		// space for y axis titles
		this.paddingLeft = -MARGIN_LEFT;

		this.width = 940 - MARGIN_LEFT - MARGIN_RIGHT;

		// title of chart is drawn or not (default: yes)
		this.drawTitle = true;

		// year ticks to be emphasized or not (default: yes)
		this.emphasizeYearTicks = 1;

		// define chart pagination
		// max. no. of datasets that is displayed, 0: all (default: all)
		//this.maxDisplayDatasets = 0;

		// dataset that is displayed first in the current
		// display, chart will show datasets "curDisplayFirstDataset" to
		// "curDisplayFirstDataset+maxDisplayDatasets"
		//this.curDisplayFirstDataset = 0;

		// range of dates that will be shown
		// if from-date (1st element) or to-date (2nd element) is zero,
		// it will be determined according to your data (default: automatically)
		this.displayDateRange = [0, 0];

		// global div for tooltip
		this.tooltipDiv = null;

		this.isDateOnlyFormat = null;

		this._drawChart = this._drawChart.bind(this);
		this._mouseOvered = this._mouseOvered.bind(this);
		this._mouseOuted = this._mouseOuted.bind(this);
	}

	componentDidMount() {
		// global div for tooltip
		this.tooltipDiv = d3.select('body').append('div')
			.attr('class', 'tooltip')
			.style('opacity', 0.0);
	}

	_labelClicked(d) {
		if (d.url != null) {
			// TODO: anpassen an leanix
			//lx.openLink(url, '_blank');
			return window.open(d.url);
		}
		return null;
	}

	_mouseOvered(d, i) {
		const event = d3.event;
		const target = event.target || event.srcElement;
		const svgElement = document.getElementById(`${this.componentId}_svg`);
		const targetX = +target.attributes['x'].value;
		const targetY = +target.attributes['y'].value;

		// check parents for row number (1st parent hold row number)
		let rowNum = null;
		let pn = target.parentNode;
		while (!rowNum && pn && pn !== svgElement) {
			rowNum = pn.attributes['row'].value;
			pn = pn.parentNode;
		}
		// tooltip positionieren!
		rowNum = 0 + (rowNum ? 1 * rowNum : 0);
		const tooltip = {
				left: this.margin.left + targetX + 12,
				top:  this.margin.top - this.paddingTopHeading + rowNum * this.lineHeight + this.barHeight / 2,
			}
		this.tooltipDiv
			.html(this._renderTooltip(d))
			.style('left', tooltip.left + 'px')
			.style('top', tooltip.top + 'px')
			.style('height', tooltip.height + 'px')
			.transition()
				.duration(500)
				.style('opacity', 1.0);
	}

	_mouseOuted() {
		this.tooltipDiv.transition()
			.duration(500)
			.style('opacity', 0.0);
	}

	// rework ticks and grid for better visual structure
	_isYear(t) {
		return +t ===  + (new Date(t.getFullYear(), 0, 1, 0, 0, 0));
	}

	_isMonth(t) {
		return +t ===  + (new Date(t.getFullYear(), t.getMonth(), 1, 0, 0, 0));
	}

	_getDate(d, format) {
		d = d || new Date();
		if (format === null || format === undefined) {
			format = 'MM';
		}
		const H = d.getHours();
		const M = d.getMinutes();
		const S = d.getSeconds();
		return {
				d: d.getDate(),
				m: this.trans[format][d.getMonth()],
				y: d.getFullYear(),
				H: (H < 10 ? '0' + H : H),
				M: (M < 10 ? '0' + M : M),
				S: (S < 10 ? '0' + S : S)
		};
	}

	_drawChart(selection) {
		let minDate;
		let maxDate;
		selection.each((dataset) => {
			// check which subset of datasets have to be displayed
			/*
			let maxPages = 0; // used if paging is on
			let startSet;
			let endSet;
			if (this.maxDisplayDatasets !== 0) {
				startSet = this.curDisplayFirstDataset;
				if (this.curDisplayFirstDataset + this.maxDisplayDatasets > dataset.length) {
					endSet = dataset.length;
				} else {
					endSet = this.curDisplayFirstDataset + this.maxDisplayDatasets;
				}
				maxPages = Math.ceil(dataset.length / this.maxDisplayDatasets);
			} else {
				startSet = 0;
				endSet = dataset.length;
			}
			const noOfDatasets = endSet - startSet;
			*/
			const noOfDatasets = dataset.length;

			//const height = this.barHeight * noOfDatasets + this.lineSpacing * noOfDatasets - 1;
			const height = this.lineHeight * noOfDatasets - 1;

			// parse data text strings to JavaScript date stamps
			if (this.isDateOnlyFormat === null) {
				this.isDateOnlyFormat = true;
			}
			const me = this;
			dataset.forEach((d) => {
				d.data.forEach((d1) => {
					//if (!(d1[IDX_FROMDATE] instanceof Date)) {
					if (!d1.origFromDate) {
						d1.origFromDate = d1[IDX_FROMDATE]; //d1.origFromDate || d1[IDX_FROMDATE];
						d1.origToDate = d1[IDX_TODATE]; //d1.origToDate || d1[IDX_TODATE];

						if (DATE_RE.test(d1[IDX_FROMDATE])) { // date only data
							d1[IDX_FROMDATE] = Date.parse(d1[IDX_FROMDATE]);
						} else if (DATETIME_RE.test(d1[IDX_FROMDATE])) { // date and time data
							d1[IDX_FROMDATE] = Date.parse(d1[IDX_FROMDATE]);
							this.isDateOnlyFormat = false;
						} else {
							throw new Error('Date/time format (' + d1[IDX_FROMDATE] + ') not recognized. Pick between \'YYYY-MM-DD\' or ' +
								'\'YYYY-MM-DD HH:MM:SS\'.');
						}

						if (this.consecutive) {
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
					if (!this.timeSpan) {
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

			if (!this.timeSpan) {
				this.timeSpan = [];
				let d = this._getDate(new Date(minDate))
				this.timeSpan.push(`${d.y}-${d.m}-${d.d}`);
				d = this._getDate(new Date(maxDate))
				this.timeSpan.push(`${d.y}-${d.m}-${d.d}`);
			}

			// cluster data by dates to form time blocks
			dataset.forEach((series, index) => {
				const tmpData = [];
				const filteredData = series.data.filter((d) => {
					return d.origFromDate < this.timeSpan[IDX_XRANGE_END] && d.origToDate >= this.timeSpan[IDX_XRANGE_START];
				});
				const dataLength = filteredData.length;
				filteredData.forEach((d, i) => {
					if (i === 0) {
						tmpData.push(d);
					} else if (i < dataLength) {
						if (d[IDX_FROMDATE] === tmpData[tmpData.length - 1][IDX_FROMDATE]) {
							// the value has not changed since the last date
							if (this.consecutive) {
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
							if (this.consecutive) {
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
				.domain([startDate - 24 * 60 * 60 * 1000, endDate])
				.range([0, this.width])
				.clamp(true);

			// define axes
			const xAxis = d3.axisTop().scale(xScale);

			// create SVG element
			this.svg = d3.select('#' + this.componentId).append('svg')
				.attr('id', `${this.componentId}_svg`)
				.attr('width', this.width + this.margin.left + this.margin.right)
				.attr('height', height + this.margin.top + this.margin.bottom)
				.append('g')
					.attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

			// create basic element groups
			this.svg.append('g').attr('id', 'g_axis');
			this.svg.append('g').attr('id', 'g_data');

			// create y axis labels
			const labels = this.svg.select('#g_axis').selectAll('text')
				//.data(dataset.slice(startSet, endSet))
				.data(dataset.slice(0, noOfDatasets))
				.enter();

			// text labels
			labels.append('text')
				.attr('x', this.paddingLeft)
				.attr('y', this.lineSpacing + this.barHeight / 2)
				.text(function (d) {
						return d.measure;
				})
				.attr('transform', ((d, i) => {
					return 'translate(0,' + (me.lineHeight * i) + ')';
				}))
				.attr('class', ((d) => {
					let returnCSSClass = 'ytitle';
					if (d.url != null) {
						returnCSSClass = returnCSSClass + ' link';
					}
					return returnCSSClass;
				}))
				.on('click', this._labelClicked);

			// create vertical grid
			if (noOfDatasets && this.props.gridlineY) {
				this.svg.select('#g_axis').selectAll('line.vert_grid')
					.data(xScale.ticks())
					.enter()
						.append('line')
							.attr('class', 'vert_grid')
							.attr('x1', (d => { return xScale(d); }))
							.attr('x2', (d => { return xScale(d); }))
							.attr('y1', 0)
							//.attr('y2', this.barHeight * noOfDatasets + this.lineSpacing * noOfDatasets - 1 + this.paddingBottom);
							.attr('y2', this.lineHeight * noOfDatasets - 1 + this.paddingBottom);
			}
			// create horizontal grid
			if (this.props.gridlineX) {
				this.svg.select('#g_axis').selectAll('line.horz_grid')
					.data(dataset)
					.enter()
						.append('line')
							.attr('class', 'horz_grid')
							.attr('x1', 0)
							.attr('x2', this.width)
							.attr('y1', ((d, i) => { return ((me.lineSpacing + me.barHeight) * i) + me.lineSpacing + me.barHeight / 2; }))
							.attr('y2', ((d, i) => { return ((me.lineSpacing + me.barHeight) * i) + me.lineSpacing + me.barHeight / 2; }));
			}

			// create x axis
			if (noOfDatasets) {
				this.svg.select('#g_axis').append('g')
					.attr('class', 'axis')
					.call(xAxis);
			}

			// make y groups for different data series
			const chartRow = this.svg.select('#g_data').selectAll('.dataset')
				.data(dataset.slice(0, noOfDatasets))
				.enter()
					.append('g')
						.attr('transform', ((d, i) => { return 'translate(0,' + (me.lineHeight * i) + ')'; }))
						.attr('class', 'dataset')
						.attr('row', ((d, i) => { return i; }));

			// add data series
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

			// Bar Labels
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

			// Bar Labels
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
							let info = d[IDX_INFO];
							if (!info || xScale(d[IDX_TODATE]) - xScale(d[IDX_FROMDATE]) < 100) {
								return null;
							}
							return info;
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

			// year emphasis
			// ensure year emphasis is only active if years are the biggest clustering unit
			if (this.emphasizeYearTicks
				 && !(isYearTick.every((d) => { return d === true; }))
				 && isMonthTick.every((d) => { return d === true; })) {
				d3.selectAll('g.tick').each(function (d, i) {
					if (isYearTick[i]) {
						d3.select(this)
							.attr('class', 'x_tick year');
					} else {
						d3.select(this).attr('class', 'x_tick');
					}
				});
				d3.selectAll('.vert_grid').each(function (d, i) {
					if (isYearTick[i]) {
						d3.select(this).attr('class', 'vert_grid_emph');
					}
				});
			}
		});

		if (this.drawTitle) {
			this._drawChartHeader();
		}

	}

	_drawChartHeader() {
		// create title
		const header = this.svg.append('g').attr('id', 'g_title');
		header.append('text')
			.attr('x', this.paddingLeft)
			.attr('y', this.paddingTopHeading)
			.attr('class', 'heading')
			.text(this.props.title);

		// create subtitle
		// determine start and end dates among all nested datasets
		let startDate = this.displayDateRange[IDX_XRANGE_START];
		let endDate = this.displayDateRange[IDX_XRANGE_END];
		const dFrom = this._getDate(new Date(startDate), 'MMMM');
		const dTo = this._getDate(new Date(endDate), 'MMMM');
		let subtitleText = '';
		if (this.isDateOnlyFormat) {
			subtitleText = `${this.trans.FROM} ${dFrom.m} ${dFrom.y} ${this.trans.TO} ${dTo.m} ${dTo.y}`;
		} else {
			switch (this.props.lang) {
				case 'de':
					subtitleText = `${this.trans.FROM} ${dFrom.d} ${dFrom.m} ${dFrom.y} ${dFrom.H}:${dFrom.M}:${dFrom.S} ${this.trans.TO} ${dTo.d}. ${dTo.m} ${dTo.y} ${dTo.H}:${dTo.M}:${dTo.S}`;
					break;
				default:
					subtitleText = `${this.trans.FROM} ${dFrom.m} ${dFrom.d}, ${dFrom.y} ${dFrom.H}:${dFrom.M}:${dFrom.S} ${this.trans.TO} ${dTo.m} ${dTo.d}, ${dTo.y} ${dTo.H}:${dTo.M}:${dTo.S}`;
			}
		}

		header.append('text')
			.attr('x', this.paddingLeft)
			.attr('y', this.paddingTopHeading + 17)
			.attr('class', 'subheading')
			.text(subtitleText);

		// create legend
		/*
		const legend = header.append('g')
			.attr('id', 'g_legend')
			.attr('transform', 'translate(0,-12)');

		legend.append('rect')
			.attr('x', this.width + this.margin.right - 150)
			.attr('y', this.paddingTopHeading)
			.attr('height', 15)
			.attr('width', 15)
			.attr('class', 'rect_has_data');

		legend.append('text')
			.attr('x', this.width + this.margin.right - 150 + 20)
			.attr('y', this.paddingTopHeading + 8.5)
			.attr('class', 'legend')
			.text('Data available');

		legend.append('rect')
			.attr('x', this.width + this.margin.right - 150)
			.attr('y', this.paddingTopHeading + 17)
			.attr('height', 15)
			.attr('width', 15)
			.attr('class', 'rect_has_no_data');

		legend.append('text')
			.attr('x', this.width + this.margin.right - 150 + 20)
			.attr('y', this.paddingTopHeading + 8.5 + 15 + 2)
			.attr('class', 'legend')
			.text('No data available');
		*/
	}

	_renderTooltip(d) {
		// display category name and stuff like that
		let output = '';
		output += `<div class='title'>`;
			output += `<span class='label'>${d[IDX_LABEL] || 'n.a.'}</span>`;
			if (this.consecutive) {
				if (d.origFromDate !== null) {
					output += ` (<span class='date'>${moment(Date.parse(d.origFromDate)).format(this.trans.FORMATTED)}</span>)`;
				}
			} else {
				if (d.origFromDate !== null && d.origToDate !== null) {
					output += ` (${this.trans.FROM} `;
					output += `<span class='date'>${moment(Date.parse(d.origFromDate)).format(this.trans.FORMATTED)}</span>`;
					output += ` ${this.trans.TO} `;
					output += `<span class='date'>${moment(Date.parse(d.origToDate)).format(this.trans.FORMATTED)}</span>)</div>`;
				}
			}
		output += '</div>';
		output += `<div class='info'><span class='key'>${this.labelInfo}:</span> ${(d[IDX_INFO]) || 'n.a.'}</div>`;
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
		this.componentId = this.props.id;
		this.component = this.component || document.getElementById(this.componentId);
		if (!this.component) {
			console.error('no component!');
			return (<div id={this.componentId}/>);
		}

		// adjust chart width to parent element width
		this.width = this.component.parentElement.clientWidth - this.margin.left - this.margin.right;
		this.drawTitle = this.props.title && this.props.title.length > 0;
		this.margin.top = (this.drawTitle ? MARGIN_TOP_WITH_TITLE : 20);

		this.trans = TRANSLATIONS[this.props.lang || 'en'];
		this.consecutive = this.props.consecutive === true;
		this.labelInfo = this.props.tooltipConfig && this.props.tooltipConfig.labelInfo ? this.props.tooltipConfig.labelInfo :  'Information';

		this.timeSpan = this.props.timeSpan;
		if (this.timeSpan && this.timeSpan.length > 1) {
			this.displayDateRange = [Date.parse(this.timeSpan[IDX_XRANGE_START]), Date.parse(this.timeSpan[IDX_XRANGE_END])];
		} else {
			this.displayDateRange = [0,0];
			this.timeSpan = null;
		}

		d3.select('#' + this.componentId).selectAll('*').remove();

		// Todo: make the chart responsive!
		d3.select('#' + this.componentId).datum(this.props.data).call(this._drawChart);
		return (
			<div id={this.componentId}/>
		);
	}
}

Roadmap.propTypes = {
	id: PropTypes.string.isRequired,
	title: PropTypes.string,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			measure: PropTypes.string,
			url: PropTypes.string,
			html: PropTypes.string,
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
	timeSpan: PropTypes.arrayOf(PropTypes.string.isRequired, PropTypes.string.isRequired),
	consecutive: PropTypes.bool,
	lang: PropTypes.string,
	gridlineX: PropTypes.bool,
	gridlineY: PropTypes.bool,
	categories: PropTypes.shape(),
	tooltipConfig: PropTypes.shape({
		labelInfo: PropTypes.string
	})
};

export default Roadmap;
