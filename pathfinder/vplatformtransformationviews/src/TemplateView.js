import React, { Component } from 'react';

class TemplateView extends Component {

	constructor(props) {
		super(props);
		this.state = {
			setup: null,
		};
	}

	render() {
		return (
			<div>
				<div className="col-xs-2">
					<div className="panel panel-default">
						<div className="panel-body">
								Basic panel example
						</div>
					</div>
				</div>
				<div className="col-xs-6">
					<div className="panel panel-default">
						<div className="panel-body">
							Basic panel example
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
}
export default TemplateView;
