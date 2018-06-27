/* The MIT License (MIT)

Copyright (c) 2018 LeanIX GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

// from https://github.com/leanix/leanix-custom-reports

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