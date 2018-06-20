import React, { Component } from 'react';
import DataHandler from './DataHandler';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import DateUtilities from './common/leanix-reporting-utilities/DateUtilities';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import ConfigureDialog from './ConfigureDialog';
import Constants from './Constants';

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this.setup = null; // set during initReport
		this.reportState = new ReportState();
		this.reportState.prepareRangeValue('selectedStartYearDistance', 1, 5, 1, 3);
		this.reportState.prepareRangeValue('selectedEndYearDistance', 1, 5, 1, 3);
		this.reportState.prepareValue('selectedXAxisUnit', Constants.X_AXIS_UNITS, Constants.X_AXIS_UNIT_QUARTERS);
		this.reportState.prepareValue('selectedYAxisLabel', this._validateLabel, 'Count of transitions');
		this.reportState.prepareValue('selectedY2AxisLabel', this._validateLabel, 'Count in production');
		// bindings
		this._initReport = this._initReport.bind(this);
		this._updateReportState = this._updateReportState.bind(this);
		this._updateDynamicReportState = this._updateDynamicReportState.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._closeConfigDialog = this._closeConfigDialog.bind(this);
		// react state definition (init)
		this.state = {
			loadingState: ReportLoadingState.INIT,
			showConfigure: false,
			chartData: []
		};
	}

	_validateLabel(value) {
		return value && value.length > 0;
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get factsheet models, only those with a lifecycle field (important assumption for other functions!)
		const factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup).filter((e) => {
			const fields = ReportSetupUtilities.getFactsheetFieldModels(setup, e);
			return fields ? fields.lifecycle : false;
		});
		if (!factsheetTypes) {
			// error, since there is no factsheet type with enough data
			this._handleError('There is no factsheet type with enough data.');
			lx.hideSpinner();
			return;
		}
		this.reportState.prepareValue('selectedFactsheetType', factsheetTypes, factsheetTypes[0]);
		this._updateDynamicReportState(factsheetTypes[0]); // try'n'catch not needed here
		// load default report state
		this.reportState.reset();
		// then restore saved report state (init)
		if (setup.savedState && setup.savedState.customState) {
			const updateError = this._updateReportState(setup.savedState.customState);
			if (updateError) {
				console.error('Please update the initial report configuration.');
				this._handleError(updateError);
				lx.hideSpinner();
				return;
			}
		}
		lx.hideSpinner();
		lx.ready(this._createConfig());
	}

	_updateReportState(newState) {
		// some validations & default values depends on the factsheet type, therefore
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
			// type DataSeries
			defaultDataSeries.push({
				name: 'In planning stage',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN],
				type: Constants.DATA_SERIES_TYPE_BAR_POSITIVE,
				axis: Constants.DATA_SERIES_AXIS_Y,
				stack: Constants.DATA_SERIES_STACK_LAST
			});
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
			// type DataSeries
			defaultDataSeries.push({
				name: 'In production',
				lifecycles: inProductionLifecycles,
				type: Constants.DATA_SERIES_TYPE_SPLINE_POSITIVE,
				axis: Constants.DATA_SERIES_AXIS_Y2,
				stack: Constants.DATA_SERIES_STACK_EVERY
			});
		}
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE)) {
			// type DataSeries
			defaultDataSeries.push({
				name: 'Retired',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE],
				type: Constants.DATA_SERIES_TYPE_BAR_NEGATIVE,
				axis: Constants.DATA_SERIES_AXIS_Y,
				stack: Constants.DATA_SERIES_STACK_FIRST
			});
		}
		if (defaultDataSeries.length === 0) {
			// no default lifecycle? at least add one made up demo series
			// type DataSeries
			defaultDataSeries.push({
				name: 'Demo series',
				lifecycles: [lifecycleModel[0]],
				type: Constants.DATA_SERIES_TYPE_BAR_POSITIVE,
				axis: Constants.DATA_SERIES_AXIS_Y,
				stack: Constants.DATA_SERIES_STACK_LAST
			});
		}
		this.reportState.prepareValue('selectedDataSeries', this._validateDataSeries, defaultDataSeries);
	}

	_validateDataSeries(value) {
		if (!Array.isArray(value) || value.length < 1) {
			return false;
		}
		const tmp = {}; // used for duplication check
		for (let i = 0; i < value.length; i++) {
			const e = value[i];
			if (!e.name || tmp[e.name]
				|| !Array.isArray(e.lifecycles) || e.lifecycles.length < 1
				|| !Constants.DATA_SERIES_TYPES.includes(e.type)
				|| !Constants.DATA_SERIES_AXES.includes(e.axis)
				|| !Constants.DATA_SERIES_STACKS.includes(e.stack)) {
				return false;
			}
			tmp[e.name] = e;
		}
		return true;
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
					this._closeConfigDialog();
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
					console.log(exportElement);
					return exportElement;
				},
				exportElementSelector: '#' + 'getChartNodeID()', // TODO
				format: 'A4',
				inputType: 'SVG',
				orientation: 'landscape'
			},
			restoreStateCallback: (state) => {
				this._closeConfigDialog();
				const updateError = this._updateReportState(state);
				if (updateError) {
					console.error('Please delete this bookmark.');
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
		// TODO
		const data = DataHandler.create(this.index.last.nodes,
			this.reportState.get('selectedXAxisUnit'),
			this.reportState.get('selectedStartYearDistance'),
			this.reportState.get('selectedEndYearDistance'),
			this.reportState.get('selectedDataSeries'));
		console.log(data);
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL,
			chartData: data.chartData,
			tableData: data.tableData
		});
		// publish report state to the framework here, b/c all changes always trigger this method
		this.reportState.publish();
	}

	_handleOnClose() {
		this.setState({
			showConfigure: false
		});
	}

	_handleOnOK(newState) {
		const oldSFT = this.reportState.get('selectedFactsheetType');
		const updateError = this._updateReportState(newState);
		if (updateError) {
			console.error('Error in Configure dialog.');
			this._handleError(updateError);
			return; // TODO how to mark error fields?
		}
		this.setState({
			showConfigure: false
		});
		if (oldSFT === this.reportState.get('selectedFactsheetType')) {
			// no need to update report config --> trigger _handleData with new config
			this._handleData();
			return;
		}
		// update report config, this will trigger the facet callback automatically
		lx.updateConfiguration(this._createConfig());
	}

	_closeConfigDialog() {
		if (this.state.showConfigure) {
			this._handleOnClose();
		}
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
		return (<h4 className='text-center'>{stepInfo}</h4>);
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
		return (
			<div>
				<ConfigureDialog
					show={this.state.showConfigure}
					setup={this.setup}
					reportState={this.reportState}
					onClose={this._handleOnClose}
					onOK={this._handleOnOK}
				/>
				<div id='content' />
			</div>
		);
	}
}

export default Report;
