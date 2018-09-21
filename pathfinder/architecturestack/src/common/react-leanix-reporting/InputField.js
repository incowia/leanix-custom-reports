/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';

class InputField extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(event) {
		let value = event.target.value;
		this.props.onChange(value);
	}

	render() {
		const style = {};
		if (this.props.width) {
			style.width = this.props.width;
		}
		return (
			<div className={ 'form-group' + (this.props.useSmallerFontSize ? ' small' : '') + (this.props.hasError ? ' has-error' : '') }>
				<label htmlFor={this.props.id} className={'control-label' + (this.props.labelReadOnly ? ' sr-only' : '') }>
					{this.props.label}
				</label>
				<input type={this.props.type}
					disabled={this.props.disabled}
					alt={this.props.label}
					className={'form-control' + (this.props.useSmallerFontSize ? ' input-sm' : '')}
					style={style}
					id={this.props.id}
					name={'input-' + this.props.type + '-' + this.props.id}
					onChange={this._onChange}
					placeholder={this.props.placeholder ? this.props.placeholder : ''}
					value={this.props.value}
					min={this.props.min ? this.props.min : ''}
					max={this.props.max ? this.props.max : ''}
				/>
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

InputField.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	type: PropTypes.string.isRequired,
	onChange: PropTypes.func,
	value: PropTypes.string.isRequired,
	useSmallerFontSize: PropTypes.bool,
	placeholder: PropTypes.string,
	labelReadOnly: PropTypes.bool,
	min: PropTypes.string,
	max: PropTypes.string,
	width: PropTypes.string,
	hasError: PropTypes.bool,
	helpText: PropTypes.string,
	disabled: PropTypes.bool
};

export default InputField;