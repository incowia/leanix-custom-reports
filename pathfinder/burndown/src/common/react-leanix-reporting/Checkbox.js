/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Checkbox extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(event) {
		let val = event.target.checked;
		if (typeof val === 'string') {
			val = val === 'true';
		}
		this.props.onChange(val);
	}

	render() {
		return (
			<div className={ 'checkbox' + (this.props.useSmallerFontSize ? ' small' : '') + (this.props.hasError ? ' has-error' : '') }>
				<label htmlFor={this.props.id}>
					<input type='checkbox'
						disabled={this.props.disabled}
						alt={this.props.label}
						id={this.props.id}
						name={'Checkbox-' + this.props.id}
						checked={this.props.value}
						onChange={this._onChange}
					/>
					{this.props.label}
				</label>
				{this._renderHelpText()}
			</div>
		);
	}

	_renderHelpText() {
		if (!this.props.helpText) {
			return null;
		}
		return (
			<span className='help-block'>{this.props.helpText}</span>
		);
	}
}

Checkbox.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	value: PropTypes.bool.isRequired,
	useSmallerFontSize: PropTypes.bool,
	hasError: PropTypes.bool,
	helpText: PropTypes.string,
	disabled: PropTypes.bool
};

export default Checkbox;