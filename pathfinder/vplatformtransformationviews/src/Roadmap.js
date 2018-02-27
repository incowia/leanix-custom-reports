import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import D3RoadmapChart from './D3RoadmapChart';

class Roadmap extends Component {

	constructor(props) {
		super(props);
		this.state = {
			width: null,
			height: null
		};

		this.componentId = 'roadmap';
		this.chartInstance = null;

		this._updateDimensions = this._updateDimensions.bind(this);
	}

	componentWillMount() {
		this._updateDimensions();
	}

	componentDidMount() {
		window.addEventListener("resize", this._updateDimensions);

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
		window.removeEventListener("resize", this._updateDimensions);
		if (this.chartInstance) {
			this.chartInstance.destroy();
			this.chartInstance = undefined;
		}
	}

	_updateDimensions() {
		const w = window;
        const d = document.documentElement;
        const b = d.getElementsByTagName('body')[0];
        const width = w.innerWidth || d.clientWidth || b.clientWidth;
        const height = w.innerHeight|| d.clientHeight|| b.clientHeight;
        this.setState({width: width, height: height});
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
		title: PropTypes.string,
		timeSpan: PropTypes.arrayOf(PropTypes.string.isRequired, PropTypes.string.isRequired),
		consecutive: PropTypes.bool,
		gridlinesXaxis: PropTypes.bool,
		gridlinesYaxis: PropTypes.bool,
		infoLabel: PropTypes.string
	})
};

export default Roadmap;
