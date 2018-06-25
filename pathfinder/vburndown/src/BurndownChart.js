import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import Wrapper from './common/react-leanix-reporting/Wrapper';
import C3BurndownChart from './C3BurndownChart';
import Constants from './Constants';

const COMPONENT_ID = 'burndown-chart';

class BurndownChart extends Component {

	constructor(props) {
		super(props);
		this._handleOnMount = this._handleOnMount.bind(this);
		this._handleOnWillUnmount = this._handleOnWillUnmount.bind(this);
		this.wrapper = React.createRef();
	}

	_handleOnMount(config, div) {
		const instance = new C3BurndownChart(div,
			this.props.data,
			this.props.dataSeries,
			this.props.labels,
			this.props.current,
			this.props.onClick);
		return {
			instance: instance
		};
	}

	shouldComponentUpdate(nextProps, nextState) {
		// rendering a chart is expensive, so just do the update call in 'componentDidUpdate' if needed
		if (this.props.current !== nextProps.current) {
			return true;
		}
		if (this.props.labels.xAxis !== nextProps.labels.xAxis
			|| this.props.labels.yAxis !== nextProps.labels.yAxis
			|| this.props.labels.y2Axis !== nextProps.labels.y2Axis) {
			return true;
		}
		const dataSeriesChanged = this.props.dataSeries.length !== nextProps.dataSeries.length ? true : this.props.dataSeries.some((currentDataSeries, i) => {
			const nextDataSeries = nextProps.dataSeries[i];
			return currentDataSeries.name !== nextDataSeries.name
				|| currentDataSeries.axis !== nextDataSeries.axis
				|| currentDataSeries.type !== nextDataSeries.type;
		});
		if (dataSeriesChanged) {
			return true;
		}
		const currentData = this.props.data;
		const nextData = nextProps.data;
		if (currentData.length !== nextData.length) {
			return true;
		}
		return currentData.some((currentE, i) => {
			const nextE = nextData[i];
			return !Utilities.areArraysEqual(currentE, nextE);
		});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		const wrapperComponent = this.wrapper.current;
		if (!wrapperComponent) {
			// no need to update, there is no component to update
			return;
		}
		wrapperComponent.reset();
	}

	_handleOnWillUnmount(config, wrapperState, div) {
		wrapperState.instance.destroy();
	}

	render() {
		return (
			<Wrapper ref={this.wrapper}
				id={COMPONENT_ID}
				onMount={this._handleOnMount}
				onWillUnmount={this._handleOnWillUnmount} />
		);
	}
}

BurndownChart.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.arrayOf(
			PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
		).isRequired
	).isRequired,
	current: PropTypes.number.isRequired,
	dataSeries: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			axis: PropTypes.oneOf(Constants.DATA_SERIES_AXES).isRequired,
			type: PropTypes.oneOf(Constants.DATA_SERIES_TYPES).isRequired
		}).isRequired
	).isRequired,
	labels: PropTypes.shape({
		xAxis: PropTypes.string.isRequired,
		yAxis: PropTypes.string.isRequired,
		y2Axis: PropTypes.string
	}).isRequired,
	onClick: PropTypes.func.isRequired
};

export default BurndownChart;