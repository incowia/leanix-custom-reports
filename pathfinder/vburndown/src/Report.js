import React, { Component } from 'react';
import DataHandler from './DataHandler';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import DateUtilities from './common/leanix-reporting-utilities/DateUtilities';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import TypeUtilities from './common/leanix-reporting-utilities/TypeUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import ConfigureDialog from './ConfigureDialog';
import BurndownChart from './BurndownChart';
import Table from './Table';
import DataSeries from './DataSeries';
import Constants from './Constants';

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this.setup = null; // set during initReport
		this.factsheetTypes = null; // set during initReport
		this.reportState = new ReportState();
		this.reportState.prepareRangeValue('selectedStartYearDistance', 1, 5, 1, 3);
		this.reportState.prepareRangeValue('selectedEndYearDistance', 1, 5, 1, 3);
		this.reportState.prepareArrayValue('selectedXAxisUnit', Constants.X_AXIS_UNITS, Constants.X_AXIS_UNIT_QUARTERS);
		this.reportState.prepareStringValue('selectedYAxisLabel', 'Count of transitions');
		this.reportState.prepareOptionalStringValue('selectedY2AxisLabel', 'Count in production');
		// bindings
		this._initReport = this._initReport.bind(this);
		this._updateReportState = this._updateReportState.bind(this);
		this._updateDynamicReportState = this._updateDynamicReportState.bind(this);
		this._validateDataSeries = this._validateDataSeries.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._handleOnClick = this._handleOnClick.bind(this);
		this._resetUI = this._resetUI.bind(this);
		// react state definition (init)
		this.state = {
			loadingState: ReportLoadingState.INIT,
			showConfigure: false,
			chartData: null,
			tableData: null,
			selectedTable: null,
			configureErrors: null
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get factsheet models, only those with a lifecycle field (important assumption for other functions!)
		this.factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup).filter((e) => {
			const fields = ReportSetupUtilities.getFactsheetFieldModels(setup, e);
			return fields ? fields.lifecycle : false;
		});
		if (!this.factsheetTypes) {
			// error, since there is no factsheet type with enough data
			this._handleError('There is no factsheet type with enough data.');
			lx.hideSpinner();
			return;
		}
		this.reportState.prepareArrayValue('selectedFactsheetType', this.factsheetTypes, this.factsheetTypes[0]);
		this._updateDynamicReportState(this.factsheetTypes[0]); // try'n'catch not needed here
		// load default report state
		this.reportState.reset();
		// then restore saved report state (init)
		if (setup.savedState && setup.savedState.customState) {
			const updateError = this._updateReportState(setup.savedState.customState);
			if (updateError) {
				/*
				 if the bookmark is the 'default' one and it contains invalids, then
				 there will be no chance to edit the report configuration --> problem? how to fix?
				*/
				console.error('Bookmark contains invalid configuration values, please delete.');
				this._handleError(updateError);
				lx.hideSpinner();
				return;
			}
		}
		lx.hideSpinner();
		lx.ready(this._createConfig());
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
		// e.g. 'lifecycle' definitions b/c they're factsheet specific
		const lifecycleModel = LifecycleUtilities.getModel(this.setup, factsheetType);
		this.index.lifecycleModel = lifecycleModel;
		const defaultDataSeries = [];
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN)) {
			defaultDataSeries.push(DataSeries.createInPlanningStage());
		}
		const inProductionLifecycles = [];
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_IN)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_IN);
		}
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_ACTIVE)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_ACTIVE);
		}
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_OUT)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_OUT);
		}
		if (inProductionLifecycles.length > 0) {
			defaultDataSeries.push(DataSeries.createInProduction(inProductionLifecycles));
		}
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE)) {
			defaultDataSeries.push(DataSeries.createRetiring());
		}
		if (defaultDataSeries.length === 0) {
			// no default lifecycle? at least add one made up demo series
			defaultDataSeries.push(DataSeries.createDemo(lifecycleModel));
		}
		this.reportState.prepareValue('selectedDataSeries', this._validateDataSeries, defaultDataSeries);
	}

	_validateDataSeries(value, key) {
		// TODO move to DataSeries
		// TODO rework
		const errors = [];
		errors.key = key;
		errors.value = value;
		if (!Array.isArray(value) || value.length < 1) {
			errors.message = 'Provided value must be a non-empty array.';
			return errors;
		}
		const set = {}; // used for duplication check
		const duplicates = [];
		const dataSeriesErrors = [];
		for (let i = 0; i < value.length; i++) {
			const dataSeries = value[i];
			const dataSeriesError = [];
			if (!TypeUtilities.isString(dataSeries.name) || dataSeries.name.length < 1) {
				dataSeriesError.push({
					path: TypeUtilities.toString(i) + '.name',
					message: 'Each data series needs a display name.'
				});
			}
			if (set[dataSeries.name]) {
				duplicates.push({
					index: i,
					dataSeries: dataSeries
				});
			} else {
				set[dataSeries.name] = {
					index: i,
					dataSeries: dataSeries
				};
			}
			if (!Array.isArray(dataSeries.lifecycles) || dataSeries.lifecycles.length < 1) {
				dataSeriesError.push({
					path: TypeUtilities.toString(i) + '.lifecycles',
					message: 'Each data series needs at least one lifecycle phase.'
				});
			} else {
				const lifecycleErrors = [];
				for (let j = 0; j < dataSeries.lifecycles.length; j++) {
					const phase = dataSeries.lifecycles[j];
					if (!TypeUtilities.isString(phase) || !this.index.lifecycleModel.includes(phase)) {
						lifecycleErrors.push({
							path: TypeUtilities.toString(i) + '.lifecycles' + '.' + TypeUtilities.toString(j),
							message: 'Provided lifecycle phase must be one of ' + this.index.lifecycleModel.join(', ') + '.'
						});
					}
				}
				dataSeriesError.push(lifecycleErrors);
			}
			if (!Constants.DATA_SERIES_TYPES.includes(dataSeries.type)) {
				dataSeriesError.push({
					path: TypeUtilities.toString(i) + '.type',
					message: 'Provided type must be one of ' + Constants.DATA_SERIES_TYPES.join(', ') + '.'
				});
			}
			if (!Constants.DATA_SERIES_AXES.includes(dataSeries.axis)) {
				dataSeriesError.push({
					path: TypeUtilities.toString(i) + '.axis',
					message: 'Provided Y axis must be one of ' + Constants.DATA_SERIES_AXES.join(', ') + '.'
				});
			}
			if (!Constants.DATA_SERIES_COUNTS.includes(dataSeries.count)) {
				dataSeriesError.push({
					path: TypeUtilities.toString(i) + '.count',
					message: 'Provided count method must be one of ' + Constants.DATA_SERIES_COUNTS.join(', ') + '.'
				});
			}
			dataSeriesErrors.push(dataSeriesError);
		}
		errors.push(dataSeriesErrors);
		if (duplicates) {
			duplicates.forEach((e) => {
				if (set[e.dataSeries.name]) {
					errors.push({
						path: TypeUtilities.toString(set[e.dataSeries.name].index) + '.name',
						message: 'Each data series needs an unique display name.'
					});
					delete set[e.dataSeries.name];
				}
				errors.push({
					path: TypeUtilities.toString(e.index) + '.name',
					message: 'Each data series needs an unique display name.'
				});
			});
		}
		if (errors.length > 0) {
			return errors;
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
				attributes: ['id', 'displayName', LifecycleUtilities.GRAPHQL_ATTRIBUTE],
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
					return exportElement.find('svg').parent();
				},
				exportElementSelector: '#chart',
				format: 'a4',
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

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: ReportLoadingState.ERROR
		});
	}

	_handleData() {
		const data = DataHandler.create(this.index.last.nodes,
			this.reportState.get('selectedXAxisUnit'),
			this.reportState.get('selectedStartYearDistance'),
			this.reportState.get('selectedEndYearDistance'),
			this.reportState.get('selectedDataSeries'),
			this.index.lifecycleModel);
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL,
			chartData: data.chartData,
			tableData: data.tableData,
			current: data.current
		});
		// publish report state to the framework here, b/c all changes always trigger this method
		this.reportState.publish();
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
			selectedTable: null,
			configureErrors: null
		});
		if (oldSFT === this.reportState.get('selectedFactsheetType')) {
			// no need to update report config --> trigger _handleData with new config
			this._handleData();
			return true;
		}
		// update report config, this will trigger the facet callback automatically
		lx.updateConfiguration(this._createConfig());
		return true;
	}

	_handleOnClick(dateIntervalName, dataSeriesName) {
		this.setState({
			selectedTable: {
				dateIntervalName: dateIntervalName,
				dataSeriesName: dataSeriesName
			}
		});
	}

	_resetUI() {
		this.setState({
			showConfigure: false,
			selectedTable: null,
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
				<div id='chart' />
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
				<div id='chart' />
			</div>
		);
	}

	_renderError() {
		return (<div id='chart' />);
	}

	_renderSuccessful() {
		const factsheetType = this.reportState.get('selectedFactsheetType');
		const factsheetName = lx.translateFactSheetType(factsheetType, 'plural');
		return (
			<div>
				<ConfigureDialog
					show={this.state.showConfigure}
					setup={this.setup}
					reportState={this.reportState}
					factsheetTypes={this.factsheetTypes}
					onClose={this._handleOnClose}
					onOK={this._handleOnOK}
					errors={this.state.configureErrors}
				/>
				{this._renderProcessingStep('Burndown: ' + factsheetName)}
				<div id='chart'>
					<BurndownChart
						data={this.state.chartData}
						current={this.state.current}
						dataSeries={this.reportState.get('selectedDataSeries')}
						labels={{
							xAxis: this.reportState.get('selectedXAxisUnit'),
							yAxis: this.reportState.get('selectedYAxisLabel'),
							y2Axis: this.reportState.get('selectedY2AxisLabel')
						}}
						onClick={this._handleOnClick} />
				</div>
				{this._renderTable(factsheetType, factsheetName)}
			</div>
		);
	}

	_renderTable(factsheetType, factsheetName) {
		const selectedTable = this.state.selectedTable;
		if (!selectedTable) {
			return this._renderProcessingStep(
				'Click on a <i class="text-info">data point</i> to see an overview of which '
				+ factsheetName
				+ ' were counted.');
		}
		const tableData = this.state.tableData[selectedTable.dateIntervalName][selectedTable.dataSeriesName];
		return (
			<div>
				{this._renderProcessingStep(factsheetName + ' for <i class="text-info">' + selectedTable.dateIntervalName + '</i> in <i class="text-info">' + selectedTable.dataSeriesName + '</i>')}
				<Table data={tableData}
					setup={this.setup}
					lifecycleModel={this.index.lifecycleModel}
					factsheetType={factsheetType}
				/>
			</div>
		);
	}
}

export default Report;
