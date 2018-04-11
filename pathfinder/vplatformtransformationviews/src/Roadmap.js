import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import D3RoadmapChart from './D3RoadmapChart';

// TODO remove

class Roadmap extends Component {

	constructor(props) {
		super(props);
		this.componentId = 'roadmap';
		this.chartInstance = null;
		this._handleResize = this._handleResize.bind(this);
	}

	_handleResize() {
		this.forceUpdate();
	}

	componentDidMount() {
		window.addEventListener('resize', this._handleResize);
		if (this.chartInstance) {
			return;
		}

		// need the chart container and data
		if (!ReactDOM.findDOMNode(this) || !this.props.data) {
			return;
		}
		this.chartInstance = new D3RoadmapChart(this.componentId);
		if (this.chartInstance) {
			this.chartInstance.display(this.props.data, this.props.categories, this.props.config);
		}
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this._handleResize);
		if (this.chartInstance) {
			this.chartInstance.destroy();
			this.chartInstance = undefined;
		}
	}

	render() {
		if (this.chartInstance) {
			this.chartInstance.display(this.props.data, this.props.categories, this.props.config);
		}
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
		timeSpan: PropTypes.arrayOf(PropTypes.string.isRequired, PropTypes.string.isRequired),
		consecutive: PropTypes.bool,
		gridlinesXaxis: PropTypes.bool,
		gridlinesYaxis: PropTypes.bool,
		infoLabel: PropTypes.string,
		bar: PropTypes.shape({
			height: PropTypes.number,
			border: PropTypes.bool
		}),
		labelYwidth: PropTypes.number
	})
};

export default Roadmap;
