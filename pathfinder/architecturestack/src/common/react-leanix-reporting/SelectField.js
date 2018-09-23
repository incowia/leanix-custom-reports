/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

class SelectField extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(option) {
		this.props.onChange(option);
	}

	render() {
		const style = {};
		if (this.props.width) {
			style.width = this.props.width;
		}
		return (
			<div className={ 'form-group' + (this.props.useSmallerFontSize ? ' small' : '') + (this.props.hasError ? ' has-error' : '') } style={style}>
				<label htmlFor={this.props.id} className={'control-label' + (this.props.labelReadOnly ? ' sr-only' : '') }>
					{this.props.label}
				</label>
				<Select
					name={'SelectField-' + this.props.id}
					id={this.props.id}
					inputProps={{
						alt: this.props.label,
						title: this.props.label
					}}
					options={this.props.options}
					placeholder={this.props.placeholder}
					matchPos='start'
					matchProp='label'
					ignoreCase={true}
					clearable={false}
					searchable={false}
					disabled={this.props.disabled || this.props.options.length < 1}
					value={this.props.value}
					onChange={this._onChange} />
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

SelectField.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	placeholder: PropTypes.string,
	onChange: PropTypes.func,
	value: PropTypes.string,
	useSmallerFontSize: PropTypes.bool,
	labelReadOnly: PropTypes.bool,
	width: PropTypes.string,
	hasError: PropTypes.bool,
	helpText: PropTypes.string,
	disabled: PropTypes.bool
};

export default SelectField;