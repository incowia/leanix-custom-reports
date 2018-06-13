import React, { Component } from 'react';
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

const DATA_SERIES_LIFECYCLES_OPTIONS = []; // will be filled at initReport

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

const DEFAULT_DATA_SERIES = []; // will be filled at initReport

class Report extends Component {

	constructor(props) {
		super(props);
		this.index = new DataIndex(true);
		this.setup = null;
		this.reportState = new ReportState();
		this.reportState.prepareRangeValue('selectedStartYearDistance', 1, 5, 1, 3);
		this.reportState.prepareRangeValue('selectedEndYearDistance', 1, 5, 1, 3);
		this.configStore = null;
		// bindings
		this._initReport = this._initReport.bind(this);
		this._createConfig = this._createConfig.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleConfig = this._handleConfig.bind(this);
		this._handleFactsheetTypeSelect = this._handleFactsheetTypeSelect.bind(this);
		this._handleStartYearDistanceInput = this._handleStartYearDistanceInput.bind(this);
		this._handleEndYearDistanceInput = this._handleEndYearDistanceInput.bind(this);
		this._handleDataSeriesNameInput = this._handleDataSeriesNameInput.bind(this);
		this._handleDataSeriesLifecyclesMultiSelect = this._handleDataSeriesLifecyclesMultiSelect.bind(this);
		this._handleDataSeriesTypeSelect = this._handleDataSeriesTypeSelect.bind(this);
		this._handleDataSeriesStackSelect = this._handleDataSeriesStackSelect.bind(this);
		this._handleDataSeriesAddButton = this._handleDataSeriesAddButton.bind(this);
		this._renderConfigContent = this._renderConfigContent.bind(this);
		// react state definition
		this.state = {
			loadingState: ReportLoadingState.INIT,
			showConfigure: false,
			chartData: []
		};
	}

	componentDidMount() {
		lx.init().then(this._initReport).catch(this._handleError);
	}

	_initReport(setup) {
		this.setup = setup;
		lx.showSpinner('Loading data...');
		// get factsheet models (only those with a lifecycle field)
		const factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup).filter((e) => {
			const fields = ReportSetupUtilities.getFactsheetFieldModels(setup, e);
			return fields.lifecycle;
		});
		this.reportState.prepareValue('selectedFactsheetType', factsheetTypes, factsheetTypes[0]);
		// next add soem default dataSeries (some might not be possible, b/c of data model modifications)
		const lifecycleDataModelValues = LifecycleUtilities.getDataModelValues(setup);
		const lifecycleDataModelValueTranslations = LifecycleUtilities.translateDataModelValues(setup, lifecycleDataModelValues);
		lifecycleDataModelValues.forEach((e, i) => {
			DATA_SERIES_LIFECYCLES_OPTIONS.push({
				value: e,
				label: lifecycleDataModelValueTranslations[i]
			});
		});
		if (lifecycleDataModelValues.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN)) {
			DEFAULT_DATA_SERIES.push({
				name: 'In planning stage',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN],
				type: DATA_SERIES_TYPE_BAR_POSITIVE,
				stack: DATA_SERIES_STACK_LAST
			});
		}
		const inProductionLifecycles = [];
		if (lifecycleDataModelValues.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_IN)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_IN);
		}
		if (lifecycleDataModelValues.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_ACTIVE)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_ACTIVE);
		}
		if (lifecycleDataModelValues.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_OUT)) {
			inProductionLifecycles.push(LifecycleUtilities.DEFAULT_MODEL_PHASE_PHASE_OUT);
		}
		if (inProductionLifecycles.length > 0) {
			DEFAULT_DATA_SERIES.push({
				name: 'In production',
				lifecycles: inProductionLifecycles,
				type: DATA_SERIES_TYPE_SPLINE_POSITIVE,
				stack: DATA_SERIES_STACK_EVERY
			});
		}
		if (lifecycleDataModelValues.includes(LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE)) {
			DEFAULT_DATA_SERIES.push({
				name: 'Retired',
				lifecycles: [LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE],
				type: DATA_SERIES_TYPE_BAR_NEGATIVE,
				stack: DATA_SERIES_STACK_FIRST
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
					|| !DATA_SERIES_STACKS.includes(e.stack)) {
					return false;
				}
				tmp[e.name] = e;
			}
			return true;
		}, DEFAULT_DATA_SERIES);
		// load default report state
		this.reportState.reset();
		// then may restore saved report state
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
		lx.hideSpinner();
		lx.ready(this._createConfig());
	}

	_createConfig(setup) {
		const selectedFactsheetType = this.reportState.get('selectedFactsheetType');
		return {
			allowEditing: false,
			allowTableView: false,
			facets: [{
				key: selectedFactsheetType,
				label: lx.translateFactSheetType(selectedFactsheetType, 'plural'),
				fixedFactSheetType: selectedFactsheetType,
				attributes: ['id', 'displayName', 'lifecycle { phases { phase startDate } }'],
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
					this.index.remove('last');
					this.index.putFacetData('last', facetData);
					// get new data and re-render
					this._handleData();
				}
			}],
			menuActions: {
				showConfigure: true,
				configureCallback: () => {
					if (this.state.loadingState !== ReportLoadingState.SUCCESSFUL) {
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
		const chartData = [];
		// TODO
		console.log(this.index);
		console.log(this.reportState);
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL,
			chartData: chartData
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

	_handleFactsheetTypeSelect(option) {
		if (this.configStore.selectedFactsheetType === option.value) {
			return;
		}
		this.configStore.selectedFactsheetType = option.value;
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
			}).sort(LifecycleUtilities.getLifecycleSorter());
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
					width='800px'
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
				<div style={{ display: 'inline-block', width: '50%', paddingRight: '0.5em' }}>
					<InputField id='startYearDistance' label='How many years to look in the past?'
						type='number' min='1' max='5'
						useSmallerFontSize
						value={this.configStore.selectedStartYearDistance.toString()}
						onChange={this._handleStartYearDistanceInput} />
				</div>
				<div style={{ display: 'inline-block', width: '50%', paddingLeft: '0.5em' }}>
					<InputField id='endYearDistance' label='How many years to look in the future?'
						type='number' min='1' max='5'
						useSmallerFontSize
						value={this.configStore.selectedEndYearDistance.toString()}
						onChange={this._handleEndYearDistanceInput} />
				</div>
				<div className='panel panel-default small'>
					<div className='panel-heading'>
						<b>Data series</b>
					</div>
					<div className='panel-body'>
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
					width='300px'
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
				<SelectField id='dataSeriesStack' label='Stack'
					width='140px'
					options={DATA_SERIES_STACK_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.stack}
					onChange={this._handleDataSeriesStackSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<button type='button'
					className='btn btn-default btn-xs'
					onClick={this._handleDataSeriesRemoveButton(index)}
				>
					<span className='glyphicon glyphicon-trash' aria-hidden='true' />
				</button>
			</div>
		);
	}
}

export default Report;
