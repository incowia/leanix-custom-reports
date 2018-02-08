import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import SelectField from './SelectField';
import Utilities from './common/Utilities';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this)
		this.state = {
			loadingState: LOADING_INIT,
			setup: null,
			data: [],
			view: 1
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		lx.ready(this._createConfig());
		lx.showSpinner('Loading data...');
		this.setState({
			setup: setup
		});
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			lx.executeGraphQL(this._createQuery()).then((data) => {
				index.put(data);
				this._handleData(index);
				console.log(index);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false,
			export: {
				autoScale: true,
				exportElementSelector: '#export',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			},
		};
	}

	_createQuery() {
		return `{applications: allFactSheets(
					filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["Application"]}]}
					)
					{
						edges {node{id name}}
					}
				}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
		lx.hideSpinner();
	}

	_handleData(index) {
		const tableData = [];
		tableData.push(1);
		lx.hideSpinner();
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			data: tableData
		});
	}

	_viewArea(view) {
		this.setState(
			{view: view}
		)
	};

	render() {
		switch (this.state.loadingState) {
			case LOADING_INIT:
				return this._renderProcessingStep('Loading data...');
			case LOADING_SUCCESSFUL:
				if (this.state.data.length === 0) {
					return this._renderProcessingStep('There is no fitting data.');
				}
				return this._renderSuccessful();
			case LOADING_ERROR:
				return this._renderError();
			default:
				throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

	_renderProcessingStep(stepInfo) {
		return (<h4 className='text-center'>{stepInfo}</h4>);
	}

	_renderError() {
		return null;
	}

	_renderSuccessful() {
		return (
			<div className='container-fluid'>
				<div className='row'>
					<div className='col-lg-2'>
						<SelectField id={'market'} label={'Market'} options={''}/>
					</div>
					<div className='col-lg-10'>
						Choose a market for which one you want to see more details.
					</div>
				</div>
				<div className='row'>
					<div className='col-lg-2'>
						<div className='panel panel-default'>
							<div className='panel-heading'>Views</div>
							<div className='panel-body'>
								<p>Choose a view down below by clicking on it. The chosen one can be exorted directly.</p>
							</div>
							<div className='panel-heading'>Platform transformation</div>
							<div className='list-group'>
								<button type='button' className='list-group-item' onClick={this._viewArea.bind(this,1)}>CSM adoption</button>
								<button type='button' className='list-group-item' onClick={this._viewArea.bind(this,2)}>Simplification and Obsolescence</button>
								<button type='button' className='list-group-item' onClick={this._viewArea.bind(this,3)}>Narrative</button>
								<button type='button' className='list-group-item' onClick={this._viewArea.bind(this,4)}>Project Roadmap</button>
							</div>
						</div>
					</div>
					<div className='col-lg-10' id='viewarea'>
						<h4>{this.state.view === 1 && "Platform transformation view for Market #1"}</h4>
						<h4>{this.state.view === 2 && "CSM adoption view for Market x"}</h4>
						<h4>{this.state.view === 3 && "Simplification and Obsolescence view for Market x"}</h4>
						<h4>{this.state.view === 4 && "EA Roadmap for Market #1"}</h4>
						<div id='export'>
							//TODO View
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default Report;
