import React, { Component } from 'react';
import DataHandler from './DataHandler';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import DateUtilities from './common/leanix-reporting-utilities/DateUtilities';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import ModalDialog from './common/react-leanix-reporting/ModalDialog';
import SelectField from './common/react-leanix-reporting/SelectField';
import MultiSelectField from './common/react-leanix-reporting/MultiSelectField';
import InputField from './common/react-leanix-reporting/InputField';

/*const CATEGORIES = _createCategories();
const CATEGORY_NAMES = CATEGORIES.map((e) => {
	return e.name;
});

function _createCategories() {
	// create categories in an interval from now - 6 month to now + 6 months
	const currentMonthStart = DateUtil.setFirstDayOfMonth(DateUtil.getInitDate(), false);
	const currentMonthEnd = DateUtil.setLastDayOfMonth(DateUtil.getInitDate(), true);
	const result = [{
			name: 'time'
		}
	];
	// get previous months
	let lastStart = currentMonthStart.clone();
	let lastEnd = currentMonthEnd.clone();
	for (let i = 6; i > 0; i--) {
		const monthStart = DateUtil.setPreviousMonth(lastStart);
		const monthEnd = DateUtil.setPreviousMonth(lastEnd);
		result[i] = {
			name: monthStart.format('MMMM Y'),
			start: DateUtil.setFirstDayOfMonth(monthStart, false),
			end: DateUtil.setLastDayOfMonth(monthEnd, true)
		};
		result[i].range = DateUtil.createRange(result[i].start, result[i].end);
		lastStart = monthStart.clone();
		lastEnd = monthEnd.clone();
	}
	// add current
	result.push({
		name: currentMonthStart.format('MMMM Y'),
		start: currentMonthStart,
		end: currentMonthEnd,
		range: DateUtil.createRange(currentMonthStart, currentMonthEnd)
	});
	lastStart = currentMonthStart.clone();
	lastEnd = currentMonthEnd.clone();
	// get next months
	for (let i = 0; i < 6; i++) {
		const monthStart = DateUtil.setNextMonth(lastStart);
		const monthEnd = DateUtil.setNextMonth(lastEnd);
		result.push({
			name: monthStart.format('MMMM Y'),
			start: DateUtil.setFirstDayOfMonth(monthStart, false),
			end: DateUtil.setLastDayOfMonth(monthEnd, true)
		});
		const j = result.length - 1;
		result[j].range = DateUtil.createRange(result[j].start, result[j].end);
		lastStart = monthStart.clone();
		lastEnd = monthEnd.clone();
	}
	return result;
}*/

const X_AXIS_UNIT_MONTHS = 'Months';
const X_AXIS_UNIT_QUARTERS = 'Quarters';
const X_AXIS_UNIT_YEARS = 'Years';
const X_AXIS_UNIT_OPTIONS = [{
		value: X_AXIS_UNIT_MONTHS,
		label: X_AXIS_UNIT_MONTHS
	}, {
		value: X_AXIS_UNIT_QUARTERS,
		label: X_AXIS_UNIT_QUARTERS
	}, {
		value: X_AXIS_UNIT_YEARS,
		label: X_AXIS_UNIT_YEARS
	}
];
const X_AXIS_UNITS = X_AXIS_UNIT_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_LIFECYCLES_OPTIONS = []; // will be filled in _createDynamicData

const DATA_SERIES_TYPE_BAR_POSITIVE = 'bar+';
const DATA_SERIES_TYPE_BAR_NEGATIVE = 'bar-';
const DATA_SERIES_TYPE_LINE_POSITIVE = 'line+';
const DATA_SERIES_TYPE_LINE_NEGATIVE = 'line-';
const DATA_SERIES_TYPE_SPLINE_POSITIVE = 'spline+';
const DATA_SERIES_TYPE_SPLINE_NEGATIVE = 'spline-';
const DATA_SERIES_TYPE_OPTIONS = [{
		value: DATA_SERIES_TYPE_BAR_POSITIVE,
		label: 'Bar positive'
	}, {
		value: DATA_SERIES_TYPE_BAR_NEGATIVE,
		label: 'Bar negative'
	}, {
		value: DATA_SERIES_TYPE_LINE_POSITIVE,
		label: 'Line positive'
	}, {
		value: DATA_SERIES_TYPE_LINE_NEGATIVE,
		label: 'Line negative'
	}, {
		value: DATA_SERIES_TYPE_SPLINE_POSITIVE,
		label: 'Spline positive'
	}, {
		value: DATA_SERIES_TYPE_SPLINE_NEGATIVE,
		label: 'Spline negative'
	}
];
const DATA_SERIES_TYPES = DATA_SERIES_TYPE_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_STACK_LAST = 'last';
const DATA_SERIES_STACK_FIRST = 'first';
const DATA_SERIES_STACK_EVERY = 'every';
const DATA_SERIES_STACK_OPTIONS = [{
		value: DATA_SERIES_STACK_LAST,
		label: 'Only last occurrence'
	}, {
		value: DATA_SERIES_STACK_FIRST,
		label: 'Only first occurrence'
	}, {
		value: DATA_SERIES_STACK_EVERY,
		label: 'Every occurrence'
	}
];
const DATA_SERIES_STACKS = DATA_SERIES_STACK_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_AXIS_Y = 'y';
const DATA_SERIES_AXIS_Y2 = 'y2';
const DATA_SERIES_AXIS_OPTIONS = [{
		value: DATA_SERIES_AXIS_Y,
		label: 'Y'
	}, {
		value: DATA_SERIES_AXIS_Y2,
		label: 'Y2'
	}
];
const DATA_SERIES_AXES = DATA_SERIES_AXIS_OPTIONS.map((e) => {
	return e.value;
});


class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex();
		this.setup = null; // set during initReport
		this.reportState = new ReportState();
		this.reportState.prepareRangeValue('selectedStartYearDistance', 1, 5, 1, 3);
		this.reportState.prepareRangeValue('selectedEndYearDistance', 1, 5, 1, 3);
		this.reportState.prepareValue('selectedXAxisUnit', X_AXIS_UNITS, X_AXIS_UNIT_QUARTERS);
		this.reportState.prepareValue('selectedYAxisLabel', this._validateLabel, 'Count of transitions');
		this.reportState.prepareValue('selectedY2AxisLabel', this._validateLabel, 'Count in production');
		this.configStore = null; // set during opening a configure dialog (see createConfig)
		// bindings
		this._initReport = this._initReport.bind(this);
		this._createDynamicData = this._createDynamicData.bind(this);
		this._mayCorrectConfigStore = this._mayCorrectConfigStore.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleConfig = this._handleConfig.bind(this);
		this._closeConfigDialog = this._closeConfigDialog.bind(this);
		this._handleFactsheetTypeSelect = this._handleFactsheetTypeSelect.bind(this);
		this._handleStartYearDistanceInput = this._handleStartYearDistanceInput.bind(this);
		this._handleEndYearDistanceInput = this._handleEndYearDistanceInput.bind(this);
		this._handleXAxisUnitSelect = this._handleXAxisUnitSelect.bind(this);
		this._handleY2AxisLabelInput = this._handleY2AxisLabelInput.bind(this);
		this._handleEndYearDistanceInput = this._handleEndYearDistanceInput.bind(this);
		this._handleDataSeriesNameInput = this._handleDataSeriesNameInput.bind(this);
		this._handleDataSeriesLifecyclesMultiSelect = this._handleDataSeriesLifecyclesMultiSelect.bind(this);
		this._handleDataSeriesTypeSelect = this._handleDataSeriesTypeSelect.bind(this);
		this._handleDataSeriesStackSelect = this._handleDataSeriesStackSelect.bind(this);
		this._handleDataSeriesAddButton = this._handleDataSeriesAddButton.bind(this);
		this._renderConfigContent = this._renderConfigContent.bind(this);
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
		this.reportState.prepareValue('selectedFactsheetType', factsheetTypes, factsheetTypes[0]);
		this._createDynamicData(factsheetTypes[0]); // try'n'catch not needed here
		// load default report state
		this.reportState.reset();
		// then restore saved report state (init)
		const restoreError = this.reportState.restore(setup, true);
		if (restoreError) {
			this._handleError(restoreError);
			lx.hideSpinner();
			return;
		}
		if (!this.reportState.get('selectedFactsheetType')) {
			// error, since there is no factsheet type with enough data
			this._handleError('There is no factsheet type with enough data.');
			lx.hideSpinner();
			return;
		}
		// update if needed, b/c of the restore call
		if (factsheetTypes[0] !== this.reportState.get('selectedFactsheetType')) {
			this._createDynamicData(this.reportState.get('selectedFactsheetType')); // try'n'catch not needed here
		}
		lx.hideSpinner();
		lx.ready(this._createConfig());
	}

	_createDynamicData(factsheetType) {
		// some data is dynamic and depends on the selected factsheet type
		// e.g. 'lifecycle' definitions b/c they're factsheet specific
		const lifecycleModel = LifecycleUtilities.getModel(this.setup, factsheetType);
		this.index.lifecycleModel = lifecycleModel;
		const lifecycleModelTranslations = LifecycleUtilities.translateModel(this.setup, lifecycleModel, factsheetType);
		DATA_SERIES_LIFECYCLES_OPTIONS.splice(0); // remove previous elements
		lifecycleModel.forEach((e, i) => {
			DATA_SERIES_LIFECYCLES_OPTIONS.push({
				value: e,
				label: lifecycleModelTranslations[i]
			});
		});
		console.log(DATA_SERIES_LIFECYCLES_OPTIONS);
		const defaultDataSeries = [];
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN)) {
			defaultDataSeries.push({
				name: 'In planning stage',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN],
				type: DATA_SERIES_TYPE_BAR_POSITIVE,
				axis: DATA_SERIES_AXIS_Y,
				stack: DATA_SERIES_STACK_LAST
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
			defaultDataSeries.push({
				name: 'In production',
				lifecycles: inProductionLifecycles,
				type: DATA_SERIES_TYPE_SPLINE_POSITIVE,
				axis: DATA_SERIES_AXIS_Y2,
				stack: DATA_SERIES_STACK_EVERY
			});
		}
		if (lifecycleModel.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE)) {
			defaultDataSeries.push({
				name: 'Retired',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE],
				type: DATA_SERIES_TYPE_BAR_NEGATIVE,
				axis: DATA_SERIES_AXIS_Y,
				stack: DATA_SERIES_STACK_FIRST
			});
		}
		if (defaultDataSeries.length === 0) {
			// no default lifecycle? at least add one made up demo series
			defaultDataSeries.push({
				name: 'Demo series',
				lifecycles: [lifecycleModel[0]],
				type: DATA_SERIES_TYPE_BAR_POSITIVE,
				axis: DATA_SERIES_AXIS_Y,
				stack: DATA_SERIES_STACK_LAST
			});
		}
		this.reportState.prepareValue('selectedDataSeries', (value) => {
			if (!Array.isArray(value) || value.length < 1) {
				return false;
			}
			const tmp = {}; // used for duplication check
			for (let i = 0; i < value.length; i++) {
				const e = value[i];
				if (!e.name || tmp[e.name]
					|| !Array.isArray(e.lifecycles) || e.lifecycles.length < 1
					|| !DATA_SERIES_TYPES.includes(e.type)
					|| !DATA_SERIES_AXES.includes(e.axis)
					|| !DATA_SERIES_STACKS.includes(e.stack)) {
					return false;
				}
				tmp[e.name] = e;
			}
			return true;
		}, defaultDataSeries);
	}

	_mayCorrectConfigStore() {
		// only call after _createDynamicData to update factsheet specific things
		const lifecycleModel = this.index.lifecycleModel;
		const selectedDataSeries = this.configStore.selectedDataSeries;
		selectedDataSeries.forEach((e) => {
			e.lifecycles = e.lifecycles.filter((e2) => {
				// remove all lifecycles that are not valid for the selected factsheet
				return lifecycleModel.includes(e2);
			});
			if (e.lifecycles.length === 0) {
				// no lifecycle left, so add a default one from the model
				e.lifecycles.push(lifecycleModel[0]);
			}
		});
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
					this.configStore = this.reportState.getAll();
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
				const newFactsheetType = state.selectedFactsheetType;
				// update if needed
				if (newFactsheetType !== this.reportState.get('selectedFactsheetType')) {
					this._createDynamicData(newFactsheetType); // try'n'catch not needed here
				}
				// now do the restore call (bookmark)
				const restoreError = this.reportState.restore(state);
				if (restoreError) {
					this._handleError(restoreError);
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
		console.log(this.index);
		console.log(this.reportState);
		const current = DateUtilities.getCurrent();
		const xAxisRange = {
			current: current,
			start: DateUtilities.minusYears(current, this.reportState.selectedStartYearDistance),
			end: DateUtilities.plusYears(current, this.reportState.selectedEndYearDistance)
		};
		const data = DataHandler.create(
			this.index.last.nodes,
			xAxisRange,
			this.reportState.selectedDataSeries);
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL,
			chartData: data.chartData,
			tableData: data.tableData
		});
		this.reportState.publish();
	}

	_handleConfig(forClose) {
		if (forClose) {
			// close or cancel: do not update values
			return () => {
				this.configStore = {};
				this.setState({
					showConfigure: false
				});
			};
		} else {
			// OK: update values
			return () => {
				const oldSFT = this.reportState.get('selectedFactsheetType');
				try {
					this.reportState.update(this.configStore);
				} catch (err) {
					 // TODO how to mark error fields?
					 console.error(err);
				}
				this.configStore = {};
				this.setState({
					showConfigure: false
				});
				if (oldSFT === this.reportState.selectedFactsheetType) {
					// no need to update report config --> trigger handleData with new config
					this.handleData();
					return;
				}
				// update report config, this will trigger the facet callback automatically
				lx.updateConfiguration(this._createConfig());
			};
		}
	}

	_closeConfigDialog() {
		if (this.state.showConfigure) {
			this._handleConfig(true)();
		}
	}

	_handleFactsheetTypeSelect(option) {
		if (this.configStore.selectedFactsheetType === option.value) {
			return;
		}
		this.configStore.selectedFactsheetType = option.value;
		this._createDynamicData(option.value); // try'n'catch not needed here
		this._mayCorrectConfigStore();
		this.forceUpdate();
	}

	_handleStartYearDistanceInput(value) {
		const num = parseInt(value, 10);
		if (this.configStore.selectedStartYearDistance === num) {
			return;
		}
		this.configStore.selectedStartYearDistance = num;
		this.forceUpdate();
	}

	_handleEndYearDistanceInput(value) {
		const num = parseInt(value, 10);
		if (this.configStore.selectedEndYearDistance === num) {
			return;
		}
		this.configStore.selectedEndYearDistance = num;
		this.forceUpdate();
	}

	_handleXAxisUnitSelect(option) {
		if (this.configStore.selectedXAxisUnit === option.value) {
			return;
		}
		this.configStore.selectedXAxisUnit = option.value;
		this.forceUpdate();
	}

	_handleYAxisLabelInput(value) {
		if (this.configStore.selectedYAxisLabel === value) {
			return;
		}
		this.configStore.selectedYAxisLabel = value;
		this.forceUpdate();
	}

	_handleY2AxisLabelInput(value) {
		if (this.configStore.selectedY2AxisLabel === value) {
			return;
		}
		this.configStore.selectedY2AxisLabel = value;
		this.forceUpdate();
	}

	_handleDataSeriesNameInput(index) {
		return (value) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			if (dataSeries.name === value) {
				return;
			}
			dataSeries.name = value;
			this.forceUpdate();
		};
	}

	_handleDataSeriesLifecyclesMultiSelect(index) {
		return (options) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			const tmp = options.map((e) => {
				return e.value;
			}).sort(LifecycleUtilities.getSorter());
			if (Utilities.areArraysEqual(dataSeries.lifecycles, tmp, true)) {
				return;
			}
			dataSeries.lifecycles = tmp;
			this.forceUpdate();
		};
	}

	_handleDataSeriesTypeSelect(index) {
		return (option) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			if (dataSeries.type === option.value) {
				return;
			}
			dataSeries.type = option.value;
			this.forceUpdate();
		};
	}

	_handleDataSeriesStackSelect(index) {
		return (option) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			if (dataSeries.stack === option.value) {
				return;
			}
			dataSeries.stack = option.value;
			this.forceUpdate();
		};
	}

	_handleDataSeriesAxisSelect(index) {
		return (option) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			if (dataSeries.axis === option.value) {
				return;
			}
			dataSeries.axis = option.value;
			this.forceUpdate();
		};
	}

	_handleDataSeriesRemoveButton(index) {
		return (event) => {
			this.configStore.selectedDataSeries.splice(index, 1);
			this.forceUpdate();
		};
	}

	_handleDataSeriesAddButton(event) {
		this.configStore.selectedDataSeries.push({
			name: '',
			lifecycles: [],
			type: DATA_SERIES_TYPE_BAR_POSITIVE,
			stack: DATA_SERIES_STACK_EVERY
		});
		this.forceUpdate();
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
				<ModalDialog show={this.state.showConfigure}
					width='900px'
					title='Configure'
					content={this._renderConfigContent}
					onClose={this._handleConfig(true)}
					onOK={this._handleConfig(false)}
				/>
				<div id='content' />
			</div>
		);
	}

	_renderConfigContent() {
		const factsheetTypeOptions = this.reportState.getAllowedValues('selectedFactsheetType').map((e) => {
			return {
				value: e,
				label: lx.translateFactSheetType(e, 'plural')
			};
		});
		// TODO validation
		return (
			<div>
				<SelectField id='factsheetType' label='Factsheet type'
					options={factsheetTypeOptions}
					useSmallerFontSize
					value={this.configStore.selectedFactsheetType}
					onChange={this._handleFactsheetTypeSelect} />
				<div>
					<div style={{ display: 'inline-block', width: '50%', paddingRight: '5px', verticalAlign: 'top' }}>
						<InputField id='startYearDistance' label='How many years to look in the past?'
							type='number' min='1' max='5'
							useSmallerFontSize
							value={this.configStore.selectedStartYearDistance.toString()}
							onChange={this._handleStartYearDistanceInput} />
					</div>
					<div style={{ display: 'inline-block', width: '50%', paddingLeft: '5px', verticalAlign: 'top' }}>
						<InputField id='endYearDistance' label='How many years to look in the future?'
							type='number' min='1' max='5'
							useSmallerFontSize
							value={this.configStore.selectedEndYearDistance.toString()}
							onChange={this._handleEndYearDistanceInput} />
					</div>
				</div>
				<div>
					<div style={{ display: 'inline-block', width: '30%', paddingRight: '5px', verticalAlign: 'top' }}>
						<SelectField id='xAxisUnit' label='X axis unit'
							options={X_AXIS_UNIT_OPTIONS}
							useSmallerFontSize
							value={this.configStore.selectedXAxisUnit}
							onChange={this._handleXAxisUnitSelect} />
					</div>
					<div style={{ display: 'inline-block', width: '35%', paddingLeft: '5px', paddingRight: '5px', verticalAlign: 'top' }}>
						<InputField id='yAxisLabel' label='Y axis label'
							type='text'
							useSmallerFontSize
							value={this.configStore.selectedYAxisLabel}
							onChange={this._handleYAxisLabelInput} />
					</div>
					<div style={{ display: 'inline-block', width: '35%', paddingLeft: '5px', verticalAlign: 'top' }}>
						<InputField id='y2AxisLabel' label='Y2 axis label'
							type='text'
							useSmallerFontSize
							value={this.configStore.selectedY2AxisLabel}
							onChange={this._handleY2AxisLabelInput} />
					</div>
				</div>
				<div className='panel panel-default small' style={{ marginBottom: '0' }}>
					<div className='panel-heading'>
						<b>Data series</b>
					</div>
					<div className='panel-body' style={{
						overflowY: 'scroll',
						height: '12em'
					}}>
						{this._renderConfigContentDataSeries()}
					</div>
					<div className='panel-footer text-right'>
						<button type='button'
							className='btn btn-default btn-xs'
							onClick={this._handleDataSeriesAddButton}
						>
							Add another series
						</button>
					</div>
				</div>
			</div>
		);
	}

	_renderConfigContentDataSeries() {
		const result = [];
		this.configStore.selectedDataSeries.forEach((e, i) => {
			// changes to the last param must be reflected in the _handleDataSeries* methods!
			result.push(this._renderDataSeries(e, i));
		});
		return result;
	}

	_renderDataSeries(dataSeries, index) {
		return (
			<div className='form-inline' key={index} style={{ marginBottom: '5px' }}>
				<InputField id='dataSeriesName' label='Display name'
					type='text'
					width='140px'
					useSmallerFontSize labelReadOnly
					value={dataSeries.name}
					onChange={this._handleDataSeriesNameInput(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<MultiSelectField id='dataSeriesLifecycles' label='Lifecycles to use'
					width='310px'
					options={DATA_SERIES_LIFECYCLES_OPTIONS}
					useSmallerFontSize labelReadOnly
					values={dataSeries.lifecycles}
					onChange={this._handleDataSeriesLifecyclesMultiSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesType' label='Type'
					width='110px'
					options={DATA_SERIES_TYPE_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.type}
					onChange={this._handleDataSeriesTypeSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesAxis' label='Y Axis'
					width='60px'
					options={DATA_SERIES_AXIS_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.axis}
					onChange={this._handleDataSeriesAxisSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesStack' label='Stack'
					width='140px'
					options={DATA_SERIES_STACK_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.stack}
					onChange={this._handleDataSeriesStackSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<button type='button'
					className='btn btn-link btn-xs'
					onClick={this._handleDataSeriesRemoveButton(index)}
				>
					<span className='glyphicon glyphicon-trash' aria-hidden='true' />
				</button>
			</div>
		);
	}
}

export default Report;
