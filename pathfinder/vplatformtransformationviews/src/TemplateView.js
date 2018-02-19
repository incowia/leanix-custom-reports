import React, { Component } from 'react';
import PropTypes from 'prop-types';

class TemplateView extends Component {

	constructor(props) {
		super(props);
		this.state = {
			setup: null,
		};
	}

	_renderPanel(panelName) {
		return(
			<div className="panel panel-default">
				<div className="panel-body" style={{textAlign: 'center'}}>
					{panelName}
				</div>
			</div>
		);
	}

	_renderGrid() {
		return (
			<div className="container-fluid">
				<div className="col-xs-2">
					<br/><br/><br/>
					{this._renderPanel('Business Management')}
				</div>
				<div className="col-xs-8">
					<div className="row">
						{this._renderPanel('Channels')}
					</div>
					<div className="row">
						{this._renderPanel('Transformation')}
					</div>
					<div className="row">
						<div className="panel panel-default">
							<div className="panel-body" style={{textAlign: 'center'}}>
								Customer Management
								<table className="table">
									<tr>
										<td>{this._renderPanel('Contact Centre Operations')}</td>
										<td>{this._renderPanel('Retail Operations & Logistics')}</td>
										<td>{this._renderPanel('CRM, Billing and Commercial Order Management')}</td>
									</tr>
								</table>
							</div>
						</div>
					</div>
				</div>
				<div className="col-xs-2">
					<div className="panel panel-default">
						<div className="panel-body">
							Key
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return this._renderGrid();
	}
}

TemplateView.propTypes = {
	sideArea: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		items: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				name: PropTypes.string.isRequired
			}).isRequired
		).isRequired
	}).isRequired,
	mainArea: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			items: PropTypes.arrayOf(
				PropTypes.shape({
					id: PropTypes.string.isRequired,
					name: PropTypes.string.isRequired
				}).isRequired
			).isRequired
		}).isRequired
	).isRequired,
	mainIntermediateArea: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired
	}).isRequired,
	legend: PropTypes.shape({
		color: PropTypes.string.isRequired,
		text: PropTypes.string.isRequired
	}).isRequired,
	colorScheme: PropTypes.object.isRequired,
	additionalContent: PropTypes.func
};

export default TemplateView;
