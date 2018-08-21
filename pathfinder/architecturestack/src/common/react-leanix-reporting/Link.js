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
import PropTypes from 'prop-types';

class Link extends Component {

	constructor(props) {
		super(props);
		this._handleClick = this._handleClick.bind(this);
	}

	_handleClick(evt) {
		evt.preventDefault();
		lx.openLink(this.props.link, this.props.target);
	}

	render() {
		if (!this.props.link || !this.props.target || !this.props.text) {
			return null;
		}
		switch (this.props.target) {
			case '_blank':
				return (
					<a href={this.props.link}
						title='Opens a new tab/window.'
						target={this.props.target}
						onClick={this._handleClick}
					>{this.props.text}</a>
				);
			default:
				return (
					<a href={this.props.link}
						target={this.props.target}
						onClick={this._handleClick}
					>{this.props.text}</a>
				);
		}
	}
}

Link.propTypes = {
	link: PropTypes.string.isRequired,
	target: PropTypes.string.isRequired,
	text: PropTypes.string.isRequired
};

export default Link;
