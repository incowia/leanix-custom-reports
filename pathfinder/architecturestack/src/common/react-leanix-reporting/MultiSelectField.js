/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';

class MultiSelectField extends Component {

	constructor(props) {
		super(props);
		this._onChange = this._onChange.bind(this);
	}

	_onChange(options) {
		this.props.onChange(!options ? [] : options);
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
				<Select multi
					name={'MultiSelectField-' + this.props.id}
					id={this.props.id}
					inputProps={{
						alt: this.props.label,
						title: this.props.label
					}}
					placeholder={this.props.placeholder}
					options={this.props.options}
					matchPos='start'
					matchProp='label'
					ignoreCase={true}
					disabled={this.props.disabled || this.props.options.length < 1}
					value={this.props.values}
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

MultiSelectField.propTypes = {
	id: PropTypes.string.isRequired,
	label: PropTypes.string.isRequired,
	options: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	onChange: PropTypes.func,
	values: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
	useSmallerFontSize: PropTypes.bool,
	labelReadOnly: PropTypes.bool,
	placeholder: PropTypes.string,
	width: PropTypes.string,
	hasError: PropTypes.bool,
	helpText: PropTypes.string,
	disabled: PropTypes.bool
};

export default MultiSelectField;