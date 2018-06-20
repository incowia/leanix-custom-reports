import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Wrapper from './common/react-leanix-reporting/Wrapper';
import C3BurndownChart from './C3BurndownChart';

const COMPONENT_ID = 'burndown-chart';

class BurndownChart extends Component {

	constructor(props) {
		super(props);
		this._handleOnMount = this._handleOnMount.bind(this);
		this._handleOnWillUnmount = this._handleOnWillUnmount.bind(this);
		this.wrapper = React.createRef();
	}

	_handleOnMount(config, div) {
		const instance = new C3BurndownChart(div, this.props.data, this.props.dataSeries);
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
			// TODO
			PropTypes.string.isRequired
		).isRequired
	).isRequired,
	dataSeries: PropTypes.arrayOf(
		// TODO
		PropTypes.string.isRequired
	).isRequired,
	onColumnClick: PropTypes.func.isRequired
};

export default BurndownChart;