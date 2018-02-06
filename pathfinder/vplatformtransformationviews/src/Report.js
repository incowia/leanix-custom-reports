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
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			setup: null,
			data: []
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
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: { facetFilters: [
						{ facetKey: "FactSheetTypes", keys: ["Application"] },
						{ facetKey: "withinTop80PercentOfTCO", keys: ["yes"] }
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							lifecycle { phases { phase startDate } }
							relApplicationToProject { edges { node { factSheet{ id } } } }
						}
					}}
				}}`;
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
			<div className='container-fluid' id='export'>
				<div className='row'>
					<div className='col-lg-2'>
						<SelectField id={'market'} label={'Market'} options={''}/>
					</div>
					<div className='col-lg-10'>
						TEXT
					</div>
				</div>
				<div className='row'>
					<div className='col-lg-2'>
						<div className='panel panel-default'>
							<div className='panel-heading'>Panel heading</div>
							<div className='panel-body'>
								<p>Some default panel content here.</p>
							</div>
							<div className='list-group'>
								<button type='button' className='list-group-item'>Cras justo odio</button>
								<button type='button' className='list-group-item'>Dapibus ac facilisis in</button>
							</div>
						</div>
					</div>
					<div className='col-lg-10'>
						<h4 className='text-center'>VIEW AREA</h4>
					</div>
				</div>
			</div>
		);
	}
}

export default Report;
