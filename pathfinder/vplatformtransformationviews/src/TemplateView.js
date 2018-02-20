import React, { Component } from 'react';
import PropTypes from 'prop-types';

// TODO: Die Abstände der einzelnen Zellen zwischen den Panels sollte nicht in Pixel erfolgen.
// TODO: writingMode und transform:rotate müssen für den IE angepasst werden.
// TODO: css-Anweisungen in eine Klasse verlagern
// TODO: gedrehte Schrift springt bei größeren Bildschirmen aus dem Panel
// TODO: Die harten Umbrüche müssen ersetzt werden.

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

	_renderView() {
		return (
			<div className="container">
				<div className="row">
					<div className="col-md-2">
						<div className="well well-sm">{this.props.sideArea.name}

							<div className="well well-sm">Schluss für heute</div>
						</div>
					</div>
					<div className="col-md-8">
						{this._renderPanel('Channels')}
						{this._renderPanel('Integration')}
						<div className="panel panel-default">
							<div className="panel-body">
								<table className="table">
									<tr>
										<td>{this._renderPanel('Contact Centre Operations')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('Retail Operations & Logistics')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('CRM, Billing and Commercial Order Management')}</td>
										<td style={{transform: 'rotate(270deg)'}}>Customer Management</td>
									</tr>
								</table>
							</div>
						</div>
						{this._renderPanel('Integration')}
						<div className="panel panel-default">
							<div className="panel-body" style={{textAlign: 'center'}}>
								<table className="table">
									<tr>
										<td>{this._renderPanel('Service Assurance')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('Charging & Policy Management')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('Service Orchestration')}</td>
										<td style={{transform: 'rotate(270deg)'}}>Service Management</td>
									</tr>
								</table>
							</div>
						</div>
						{this._renderPanel('Integration')}
						<div className="panel panel-default">
							<div className="panel-body" style={{textAlign: 'center'}}>
								<table className="table">
									<tr>
										<td>{this._renderPanel('Resource Fault & Performance')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('Resource Inventory')}</td>
										<td width="2px"></td>
										<td>{this._renderPanel('Resource Activation & Configuration')}</td>
										<td style={{transform: 'rotate(270deg)'}}>Resource Management</td>
									</tr>
								</table>
							</div>
						</div>
					</div>
					<div className="col-md-2">
						<div className="panel panel-default">
							<div className="panel-body">
								Key
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	render() {
		return this._renderView();
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
