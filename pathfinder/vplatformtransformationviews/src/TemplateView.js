import React, { Component } from 'react';

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
						<div className="panel panel-default">
							<div className="panel-body">
								Transformation
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
export default TemplateView;
