import c3 from 'c3';
import Constants from './Constants';

class C3BurndownChart {

	constructor(div, data, dataSeries, labels, currentCategory, onClick) {
		this._data = data;
		this._onClick = onClick;
		this.chart = this._create(div, data, dataSeries, labels, currentCategory);
		// bindings
		this._handleOnClick = this._handleOnClick.bind(this);
		this.destroy = this.destroy.bind(this);
	}

	_handleOnClick() {
		const self = this;
		return (data, element) => {
			self._onClick(self._data[0][data.index + 1], data.id);
		};
	}

	_create(div, data, dataSeries, labels, currentCategory) {
		const chartConfig = {
			bindto: div,
			data: {
				columns: data,
				x: 'time',
				names: {},
				axes: {},
				types: {},
				order: (first, second) => {
					const firstIndex = dataSeries.findIndex((e) => {
						return e.name === first.id;
					});
					const secondIndex = dataSeries.findIndex((e) => {
						return e.name === second.id;
					});
					return firstIndex - secondIndex;
				},
				empty: {
					label: {
						text: 'Loading data...'
					}
				},
				onclick: this._handleOnClick()
			},
			regions: [{
					// -0.5 & +0.5 for alignment
					axis: 'x', start: currentCategory - 0.5, end: currentCategory + 0.5, class: 'chart-current-column'
				}
			],
			axis: {
				x: {
					type: 'category',
					tick: {
						rotate: -50,
						multiline: false
					},
					height: 100,
					label: {
						text: labels.xAxis,
						position: 'outer-center'
					}
				},
				y: {
					label: {
						text: labels.yAxis,
						position: 'outer-middle'
					},
					tick: {
						outer: false
					}
				}
			},
			grid: {
				y: {
					show: true
				},
				focus: {
					show: false
				}
			},
			legend: {
				position: 'inset',
				inset: {
					anchor: 'top-right',
					x: 20,
					y: 0,
					step: Math.min(dataSeries.length, 3)
				}
			},
			zoom: {
				enabled: true
			}
		};
		const groups = {};
		let useY2 = false;
		dataSeries.forEach((dataSerie) => {
			chartConfig.data.names[dataSerie.name] = dataSerie.name;
			chartConfig.data.axes[dataSerie.name] = dataSerie.axis;
			if (dataSerie.axis === Constants.DATA_SERIES_AXIS_Y2) {
				useY2 = true;
			}
			const type = dataSerie.type.substring(0, dataSerie.type.length - 1);
			const inverseValue = dataSerie.type.endsWith('-');
			chartConfig.data.types[dataSerie.name] = type;
			// build the groups by type & axis
			let groupPairs = groups[type];
			if (!groupPairs) {
				groupPairs = Constants.DATA_SERIES_AXES.reduce((acc, e) => {
					acc[e] = {
						positive: [],
						negative: []
					};
					return acc;
				}, {});
				groups[type] = groupPairs;
			}
			groups[type][dataSerie.axis][inverseValue ? 'negative' : 'positive'].push(dataSerie.name);
		});
		const chartGroups = [];
		const shouldAxisBeCentered = {};
		for (let type in groups) {
			for (let axis in groups[type]) {
				const groupPairs = groups[type][axis];
				if (!groupPairs.positive || !groupPairs.negative) {
					continue;
				}
				const length = Math.min(groupPairs.positive.length, groupPairs.negative.length);
				for (let i = 0; i < length; i++) {
					chartGroups.push([groupPairs.positive[i], groupPairs.negative[i]]);
					shouldAxisBeCentered[axis] = true;
				}
			}
		}
		if (useY2) {
			chartConfig.axis.y2 = {
				show: true,
				tick: {
					outer: false
				}
			};
			if (labels.y2Axis.length > 0) {
				chartConfig.axis.y2.label = {
					text: labels.y2Axis,
					position: 'outer-middle'
				};
			}
			if (shouldAxisBeCentered.y2) {
				chartConfig.axis.y2.center = 0;
			}
		}
		if (chartGroups) {
			chartConfig.data.groups = chartGroups;
			if (shouldAxisBeCentered.y) {
				chartConfig.axis.y.center = 0;
			}
		}
		return c3.generate(chartConfig);
	}

	destroy() {
		this.chart = this.chart.destroy();
	}
}

export default C3BurndownChart;