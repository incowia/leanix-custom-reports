import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

// TODO add prop & logic for Resize Events

class Wrapper extends Component {

	constructor(props) {
		super(props);
		this.getInnerState = this.getInnerState.bind(this);
		this.getConfig = this.getConfig.bind(this);
		// some props needs to stay the same during the whole lifecycle of this component,
		// that's why the wrapper separates its props and creates an own config, which gets passed down
		const config = {
			id: props.id
		};
		Object.freeze(config);
		this.config = config;
		this.innerState = undefined;
	}

	componentDidMount() {
		if (this.getInnerState()) {
			// no need to re-create what's already there
			return;
		}
		const divElement = ReactDOM.findDOMNode(this);
		if (!divElement) {
			// seems like the rendering is not finished yet, try the next call then
			return;
		}
		const initialInnerState = this.props.onMount(this.getConfig(), divElement);
		this.innerState = initialInnerState;
	}

	componentWillUnmount() {
		const divElement = ReactDOM.findDOMNode(this);
		this.props.onWillUnmount(this.getConfig(), this.getInnerState(), divElement);
		this.innerState = undefined;
	}

	getConfig() {
		return this.config;
	}

	getInnerState() {
		return this.innerState;
	}

	render() {
		return (
			<div id={this.props.id}
				className={this.props.className ? this.props.className : ''}
				style={this.props.style ? this.props.style : {}} />
		);
	}
}

Wrapper.propTypes = {
	id: PropTypes.string.isRequired,
	className: PropTypes.string,
	style: PropTypes.object,
	onMount: PropTypes.func.isRequired,
	onWillUnmount: PropTypes.func.isRequired
};

export default Wrapper;