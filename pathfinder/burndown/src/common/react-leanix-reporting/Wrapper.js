/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';

class Wrapper extends Component {

	constructor(props) {
		super(props);
		this.getInnerState = this.getInnerState.bind(this);
		this.getConfig = this.getConfig.bind(this);
		this.reset = this.reset.bind(this);
		// some props needs to stay the same during the whole lifecycle of this component,
		// that's why the wrapper separates its props and creates an own config, which gets passed down
		const config = {
			id: props.id
		};
		Object.freeze(config);
		this._config = config;
		this._innerState = undefined;
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
		this._innerState = initialInnerState;
	}

	componentWillUnmount() {
		const divElement = ReactDOM.findDOMNode(this);
		this.props.onWillUnmount(this.getConfig(), this.getInnerState(), divElement);
		this._innerState = undefined;
	}

	getConfig() {
		return this._config;
	}

	getInnerState() {
		return this._innerState;
	}

	reset() {
		this.componentWillUnmount();
		this.componentDidMount();
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