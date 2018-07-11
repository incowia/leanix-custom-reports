import React, { Component } from 'react';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import TagUtilities from './common/leanix-reporting-utilities/TagUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import SelectField from './common/react-leanix-reporting/SelectField';
import DataHandler from './DataHandler';
import Constants from './Constants';
import ConfigureDialog from './ConfigureDialog';

const SELECT_FIELD_STYLE = {
	width: '300px',
	display: 'inline-block',
	verticalAlign: 'top',
	marginRight: '1em'
};

const SWAP_BUTTON_STYLE = {
	display: 'inline-block',
	verticalAlign: 'top',
	marginTop: '1.75em',
	marginRight: '1em'
};

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this.setup = null; // set during initReport
		this.factsheetTypes = null; // set during initReport
		this.factsheetTypeOptions = null; // set during initReport
		this.reportState = new ReportState();
		this.reportState.prepareBooleanValue('showEmptyRows', false);
		this.reportState.prepareBooleanValue('showEmptyColumns', false);
		this.reportState.prepareBooleanValue('showMissingDataWarning', true);
		// bindings
		this._initReport = this._initReport.bind(this);
		this._updateReportState = this._updateReportState.bind(this);
		this._updateDynamicReportState = this._updateDynamicReportState.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._createAllViewInfosQuery = this._createAllViewInfosQuery.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._handleViewSelect = this._handleViewSelect.bind(this);
		this._handleXAxisSelect = this._handleXAxisSelect.bind(this);
		this._handleYAxisSelect = this._handleYAxisSelect.bind(this);
		this._handleSwapAxes = this._handleSwapAxes.bind(this);
		this._resetUI = this._resetUI.bind(this);
		// react state definition (init)
		this.state = {
			loadingState: ReportLoadingState.INIT,
			showConfigure: false,
			missingData: null,
			legendData: null,
			matrixData: null,
			matrixDataAvailable: false,
			configureErrors: null
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get all factsheet types
		this.factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup);
		// get all tags, then data for the views and finally the data from facet config
		lx.executeGraphQL(TagUtilities.ALL_TAG_GROUPS_QUERY).then((tagGroups) => {
			this.index.putGraphQL(tagGroups);
			// get the views
			lx.executeGraphQL(this._createAllViewInfosQuery()).then((allViewInfos) => {
				this.viewModels = DataHandler.createViewModels(setup, allViewInfos, this.index.tagGroups.byID);
				// filter out all factsheet types that have no viewModels
				this.factsheetTypes = Object.keys(this.viewModels);
				if (!this.factsheetTypes) {
					// error, since there is no factsheet type with enough data
					this._handleError('There is no factsheet type with enough data.');
					lx.hideSpinner();
					return;
				}
				this.factsheetTypeOptions = this.factsheetTypes.map((e) => {
					return {
						value: e,
						label: lx.translateFactSheetType(e, 'plural')
					};
				});
				this.reportState.prepareEnumValue('selectedFactsheetType', this.factsheetTypes, this.factsheetTypes[0]);
				this._updateDynamicReportState(this.factsheetTypes[0]); // try'n'catch not needed here
				// load default report state
				this.reportState.reset();
				// then restore saved report state (init)
				if (setup.savedState && setup.savedState.customState) {
					const updateError = this._updateReportState(setup.savedState.customState);
					if (updateError) {
						/*
						 if the bookmark is the 'default' one and contains invalids, then
						 there will be no chance to edit the report configuration --> problem?
						 answer: no, b/c bookmarks are version specific, therefore this case
						 only happen in dev mode, which is a rare case
						*/
						console.error('Bookmark contains invalid configuration values, please delete.');
						this._handleError(updateError);
						lx.hideSpinner();
						return;
					}
				}
				lx.hideSpinner();
				lx.ready(this._createConfig());
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_updateReportState(newState) {
		// some validations & default values depend on the factsheet type, therefore
		// a 2-step update is needed
		const newFactsheetType = newState.selectedFactsheetType;
		const oldFactsheetType = this.reportState.get('selectedFactsheetType');
		if (newFactsheetType !== oldFactsheetType) {
			try {
				this.reportState.set('selectedFactsheetType', newFactsheetType);
			} catch (err) {
				// saved one is not valid anymore
				return err;
			}
			this._updateDynamicReportState(newFactsheetType);
			// reset select states for view & axes, b/c factsheet type changed
			this.reportState.reset('selectedView');
			this.reportState.reset('selectedXAxis');
			this.reportState.reset('selectedYAxis');
			delete newState.selectedView;
			delete newState.selectedXAxis;
			delete newState.selectedYAxis;
		}
		// now update the other values
		try {
			this.reportState.update(newState);
		} catch (err) {
			// restore the old factsheet type
			this.reportState.set('selectedFactsheetType', oldFactsheetType);
			this._updateDynamicReportState(oldFactsheetType);
			return err;
		}
	}

	_updateDynamicReportState(factsheetType) {
		// some data is dynamic and depends on the selected factsheet type
		const viewModels = this.viewModels[factsheetType];
		// always fallback to the first one
		this.reportState.prepareComplexEnumValue('selectedView', viewModels, 'key', viewModels[0]);
		// view options have at least 2 elements, see '_initReport'
		if (viewModels.length === 2) {
			// x & y axes should differ
			this.reportState.prepareComplexEnumValue('selectedXAxis', viewModels, 'key', viewModels[0]);
			this.reportState.prepareComplexEnumValue('selectedYAxis', viewModels, 'key', viewModels[1]);
		} else {
			this.reportState.prepareComplexEnumValue('selectedXAxis', viewModels, 'key', viewModels[1]);
			this.reportState.prepareComplexEnumValue('selectedYAxis', viewModels, 'key', viewModels[2]);
		}
	}

	_createConfig() {
		const selectedFactsheetType = this.reportState.get('selectedFactsheetType');
		return {
			allowEditing: false,
			allowTableView: false,
			facets: [{
				key: selectedFactsheetType,
				label: lx.translateFactSheetType(selectedFactsheetType, 'plural'),
				fixedFactSheetType: selectedFactsheetType,
				attributes: ['id', 'displayName'],
				sorting: [{
						key: 'displayName',
						mode: 'BY_FIELD',
						order: 'asc'
					}
				],
				callback: (facetData) => {
					if (this.state.loadingState === ReportLoadingState.SUCCESSFUL) {
						this.setState({
							loadingState: ReportLoadingState.NEW_DATA
						});
					}
					this._resetUI();
					this.index.remove('last');
					this.index.putFacetData('last', facetData);
					// get new data and re-render
					this._handleData();
				}
			}],
			menuActions: {
				showConfigure: true,
				configureCallback: () => {
					if (this.state.loadingState !== ReportLoadingState.SUCCESSFUL || this.state.showConfigure) {
						return;
					}
					this.setState({
						showConfigure: true
					});
				}
			},
			export: {
				autoScale: true,
				beforeExport: (exportElement) => {
					// TODO
					return exportElement;
				},
				exportElementSelector: '#content',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			},
			restoreStateCallback: (state) => {
				this._resetUI();
				const updateError = this._updateReportState(state);
				if (updateError) {
					console.error('Bookmark contains invalid configuration values, please delete.');
					this._handleError(updateError);
					return;
				}
				// get new data and re-render
				this._handleData();
			}
		};
	}

	_createAllViewInfosQuery() {
		const query = this.factsheetTypes.map((e) => {
			return `${e}:view(
						filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${e}"]}]}
					) {
						viewInfos { key label type viewOptionSupport { usesRangeLegend } }
					}`;
		}).join('\n');
		return `{${query}}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: ReportLoadingState.ERROR
		});
	}

	_handleData() {
		console.log(this.setup);
		console.log(this.viewModels);
		console.log(this.factsheetTypes);
		console.log(this.reportState);
		console.log(this.index);
		const data = DataHandler.create();
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL
		});
		// publish report state to the framework here, b/c all changes always trigger this method
		this.reportState.publish(); // TODO not true
	}

	_handleOnClose() {
		this.setState({
			showConfigure: false,
			configureErrors: null
		});
	}

	_handleOnOK(newState) {
		const oldSFT = this.reportState.get('selectedFactsheetType');
		const updateError = this._updateReportState(newState);
		if (updateError) {
			this.setState({
				configureErrors: updateError
			});
			return false;
		}
		this.setState({
			showConfigure: false,
			configureErrors: null
		});
		if (oldSFT === this.reportState.get('selectedFactsheetType')) {
			// no need to update report config
			// publish call is special here, b/c this action doesn't trigger '_handleData'
			// TODO not true
			this.reportState.publish();
			return true;
		}
		// update report config, this will trigger the facet callback automatically
		lx.updateConfiguration(this._createConfig());
		return true;
	}

	_handleViewSelect(option) {
		const selectedView = this.reportState.get('selectedView');
		if (selectedView.key === option.value) {
			return;
		}
		this._resetUI();
		// TODO re-compute matrix
	}

	_handleXAxisSelect(option) {
		const selectedXAxis = this.reportState.get('selectedXAxis');
		if (selectedXAxis.key === option.value) {
			return;
		}
		this._resetUI();
		// TODO re-compute matrix
	}

	_handleYAxisSelect(option) {
		const selectedYAxis = this.reportState.get('selectedYAxis');
		if (selectedYAxis.key === option.value) {
			return;
		}
		this._resetUI();
		// TODO re-compute matrix
	}

	_handleSwapAxes() {
		this.reportState.update({
			selectedXAxis: this.reportState.get('selectedYAxis'),
			selectedYAxis: this.reportState.get('selectedXAxis')
		});
		// TODO re-compute matrix
	}

	_resetUI() {
		// do not reset all states!
		this.setState({
			loadingState: ReportLoadingState.NEW_DATA,
			showConfigure: false,
			missingData: null,
			legendData: null,
			matrixData: null,
			matrixDataAvailable: false,
			configureErrors: null
		});
	}

	render() {
		switch (this.state.loadingState) {
			case ReportLoadingState.INIT:
				return this._renderInit();
			case ReportLoadingState.NEW_DATA:
				return this._renderLoading();
			case ReportLoadingState.SUCCESSFUL:
				return this._renderSuccessful();
			case ReportLoadingState.ERROR:
				return this._renderError();
			default:
				throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

	_renderInit() {
		return (
			<div>
				{this._renderProcessingStep('Initialise report...')}
				<div id='content' />
			</div>
		);
	}

	_renderProcessingStep(stepInfo) {
		return (<h4 className='text-center' dangerouslySetInnerHTML={{ __html: stepInfo }} />);
	}

	_renderLoading() {
		return (
			<div>
				{this._renderProcessingStep('Loading data...')}
				<div id='content' />
			</div>
		);
	}

	_renderError() {
		return (<div id='content' />);
	}

	_renderSuccessful() {
		const factsheetType = this.reportState.get('selectedFactsheetType');
		return (
			<div>
				<ConfigureDialog
					show={this.state.showConfigure}
					setup={this.setup}
					reportState={this.reportState}
					factsheetTypes={this.factsheetTypeOptions}
					onClose={this._handleOnClose}
					onOK={this._handleOnOK}
					errors={this.state.configureErrors}
				/>
				{this._renderSelectFields(factsheetType)}
			</div>
		);
	}

	_renderSelectFields(factsheetType) {
		const viewOptions = this.viewModels[factsheetType].map((e) => {
			return {
				value: e.key,
				label: e.label
			};
		});
		const viewOption = this.reportState.get('selectedView').value;
		const xAxisOption = this.reportState.get('selectedXAxis').value;
		const yAxisOption = this.reportState.get('selectedYAxis').value;
		const xAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
			// remove selected options from y axis options
			return e.value !== yAxisOption;
		});
		const yAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
			// remove selected options from x axis options
			return e.value !== xAxisOption;
		});
		const errors = this.state.configureErrors ? this.state.configureErrors : {};
		return (
			<div>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='view' label='View'
						options={viewOptions}
						useSmallerFontSize
						value={viewOption}
						onChange={this._handleViewSelect}
						hasError={errors.selectedView ? true : false}
						helpText={errors.selectedView} />
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='x-axis' label='X-Axis'
						options={xAxisOptions}
						useSmallerFontSize
						value={xAxisOption}
						onChange={this._handleXAxisSelect}
						hasError={errors.selectedXAxis ? true : false}
						helpText={errors.selectedXAxis} />
				</span>
				<span style={SWAP_BUTTON_STYLE}>
					<button type='button' className='btn btn-link btn-xs'
						aria-label='Swap axes' title='Swap axes'
						disabled={(xAxisOptions && xAxisOptions.length < 1) || (yAxisOptions && yAxisOptions.length < 1)}
						onClick={this._handleSwapAxes}
					>
						<span className='glyphicon glyphicon-retweet' aria-hidden='true' />
						<span className='sr-only'>Swap axes</span>
					</button>
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='y-axis' label='Y-Axis'
						options={yAxisOptions}
						useSmallerFontSize
						value={yAxisOption}
						onChange={this._handleYAxisSelect}
						hasError={errors.selectedYAxis ? true : false}
						helpText={errors.selectedYAxis} />
				</span>
			</div>
		);
	}
}

export default Report;
