import React, { Component } from 'react';
import PropTypes from 'prop-types';

class NarrativeView extends Component {
	render() {
		if (!this.props.data || this.props.data.length === 0) {
			return null;
		}

		return (
			<div className='platformlist'>{
				this.props.data.map((platform, index) => {
					return (
						<div key={'platform' + index} className='platform'>
							<div className='name'>{platform.platform}</div>
							<div className='plans'>
								{platform.plans.map((item, index) => { return (<div key={'plan' + index} className='plan'>{item}</div>); })}
							</div>
						</div>
					);
				})
			}</div>
		);
	}
}

NarrativeView.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			platform: PropTypes.string.isRequired,
			plans: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired
};

export default NarrativeView;
