import React, { Component } from 'react';
import PropTypes from 'prop-types';

class NarrativeView extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		if (!this.props.data || this.props.data.length === 0) {
			return (<h4 className='text-center'>There is no data available.</h4>);
		}
		return (
			<table className='table table-bordered table-striped table-hover table-condensed'>
				<thead>
					<tr>
						<th>Platform</th>
						<th>Plans</th>
					</tr>
				</thead>
				<tbody>
					{this.props.data.map((platform) => {
						return (
							<tr key={platform.id}>
								<td>{platform.name}</td>
								<td>
									<ul>
										{platform.plans.map((plan, i) => {
											return (<li key={i}>{plan}</li>);
										})}
									</ul>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}
}

NarrativeView.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			plans: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	)
};

export default NarrativeView;
