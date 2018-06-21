import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
			this.props.onColumnClick);
		return {
			instance: instance
		};
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
	dataSeries: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			axis: PropTypes.oneOf([Constants.DATA_SERIES_AXIS_Y, Constants.DATA_SERIES_AXIS_Y2]).isRequired,
			type: PropTypes.oneOf([
				Constants.DATA_SERIES_TYPE_BAR_POSITIVE,
				Constants.DATA_SERIES_TYPE_BAR_NEGATIVE,
				Constants.DATA_SERIES_TYPE_LINE_POSITIVE,
				Constants.DATA_SERIES_TYPE_LINE_NEGATIVE,
				Constants.DATA_SERIES_TYPE_SPLINE_POSITIVE,
				Constants.DATA_SERIES_TYPE_SPLINE_NEGATIVE,
				Constants.DATA_SERIES_TYPE_AREA_POSITIVE,
				Constants.DATA_SERIES_TYPE_AREA_NEGATIVE,
				Constants.DATA_SERIES_TYPE_AREA_SPLINE_POSITIVE,
				Constants.DATA_SERIES_TYPE_AREA_SPLINE_NEGATIVE
			]).isRequired
		}).isRequired
	).isRequired,
	labels: PropTypes.shape({
		xAxis: PropTypes.string.isRequired,
		yAxis: PropTypes.string.isRequired,
		y2Axis: PropTypes.string
	}).isRequired,
	onColumnClick: PropTypes.func.isRequired
};

export default BurndownChart;