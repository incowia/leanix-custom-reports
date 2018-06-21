import c3 from 'c3';

class C3BurndownChart {

	constructor(div, data, dataSeries, labels, onColumnClick) {
		this._data = data;
		this._onColumnClick = onColumnClick;
		this.chart = this._create(div, data, dataSeries, labels);
		// bindings
		this._handleOnClick = this._handleOnClick.bind(this);
		this.destroy = this.destroy.bind(this);
	}

	_handleOnClick() {
		const self = this;
		return (data, element) => {
			self._onColumnClick(self._data[0][data.index + 1]);
		};
	}

	_create(div, data, dataSeries, labels) {
		// TODO region: current
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
					step: 3
				}
			},
			zoom: {
				enabled: true
			}
		};
		const groups = {};
		dataSeries.forEach((dataSerie) => {
			chartConfig.data.names[dataSerie.name] = dataSerie.name;
			chartConfig.data.axes[dataSerie.name] = dataSerie.axis;
			const type = dataSerie.type.substring(0, dataSerie.type.length - 1);
			const inverseValue = dataSerie.type.endsWith('-');
			chartConfig.data.types[dataSerie.name] = type;
			let groupPairs = groups[type];
			// TODO diff between y axes!
			if (!groupPairs) {
				groupPairs = {
					positive: [],
					negative: []
				};
				groups[type] = groupPairs;
			}
			groups[type][inverseValue ? 'negative' : 'positive'].push(dataSerie.name);
		});
		const chartGroups = [];
		for (let type in groups) {
			const groupPairs = groups[type];
			if (!groupPairs.positive || !groupPairs.negative) {
				continue;
			}
			const length = Math.min(groupPairs.positive.length, groupPairs.negative.length);
			for (let i = 0; i < length; i++) {
				chartGroups.push([groupPairs.positive[i], groupPairs.negative[i]]);
			}
		}
		if (chartGroups) {
			chartConfig.data.groups = chartGroups;
			// TODO chartConfig.axis.y.center = 0
		}
		if (labels.y2Axis.length > 0) {
			chartConfig.axis.y2 = {
				show: true,
				label: {
					text: labels.y2Axis,
					position: 'outer-middle'
				},
				tick: {
					outer: false
				}
			};
		}
		return c3.generate(chartConfig);
	}

	destroy() {
		this.chart = this.chart.destroy();
	}
}

export default C3BurndownChart;