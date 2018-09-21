/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Label from './Label';

class Legend extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		if (!this.props.items || this.props.items.length === 0) {
			return null;
		}
		return (
			<div className='legend' style={{
				marginBottom: '0.5em'
			}}>
				{this.props.items.map((e, i) => {
					const style = {};
					if (i !== this.props.items.length - 1) {
						style.marginRight = '5px';
					}
					return (
						<span key={i} style={style}>
							<Label
								label={e.label}
								bgColor={e.bgColor}
								color={e.color}
								width={this.props.itemWidth}
							/>
						</span>
					);
				})}
			</div>
		);
	}
}

Legend.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape({
			label: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
			bgColor: PropTypes.string.isRequired,
			color: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	itemWidth: PropTypes.string.isRequired
};

export default Legend;