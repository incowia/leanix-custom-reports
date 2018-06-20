import c3 from 'c3';

class C3BurndownChart {

	constructor(div, data, dataSeries) {
		this.chart = this._create(div, data, dataSeries);
		// bindings
		this.destroy = this.destroy.bind(this);
	}

	_create(div, data, dataSeries) {
		const chartConfig = {
			bindto: div,
			data: {
				columns: data,
				x: 'time',
				names: {},
				axes: {},
				types: {},
				groups: {},
				empty: {
					label: {
						text: 'Loading data...'
					}
				}
			},
			axis: {
				x: {
					type: 'category',
					tick: {
						rotate: -50,
						multiline: false
					}
					height: 100,
					label: {
						text: 'TODO',
						position: 'outer-center'
					}
				},
				y: {
					label: {
						text: 'TODO',
						position: 'outer-middle'
					},
					center: 0,
					tick: {
						outer: false
					}
				},
				y2: {}
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
		return c3.generate(chartConfig);
	}

	destroy() {
		this.chart.destroy();
	}
}

export default C3BurndownChart;