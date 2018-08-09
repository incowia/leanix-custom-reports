import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TypeUtilities from './../leanix-reporting-utilities/TypeUtilities';

class Label extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		const style = {
			display: 'inline-block',
			textOverflow: 'ellipsis',
			overflow: 'hidden',
			width: this.props.width ? this.props.width : 'auto',
			backgroundColor: this.props.bgColor,
			color: this.props.color
		};
		switch (style.backgroundColor) {
			case 'white':
			case '#FFFFFF':
			case '#FFF':
			case '#FF':
			case '#ffffff':
			case '#fff':
			case '#ff':
			case 'rgb(255,255,255)':
				style.border = '2px solid silver';
				break;
			default:
				style.border = '2px solid ' + this.props.bgColor;
				break;
		}
		const label = this.props.label();
		if (TypeUtilities.isString(label)) {
			return (
				<span className='label' style={style} title={label}>{label}</span>
			);
		}
		return (
			<span className='label' style={style}>{label}</span>
		);
	}
}

Label.propTypes = {
	label: PropTypes.func.isRequired,
	bgColor: PropTypes.string.isRequired,
	color: PropTypes.string.isRequired,
	width: PropTypes.string
};

export default Label;