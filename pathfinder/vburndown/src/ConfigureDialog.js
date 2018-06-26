import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import ModalDialog from './common/react-leanix-reporting/ModalDialog';
import SelectField from './common/react-leanix-reporting/SelectField';
import MultiSelectField from './common/react-leanix-reporting/MultiSelectField';
import InputField from './common/react-leanix-reporting/InputField';
import DataSeries from './DataSeries';
import Constants from './Constants';

const DIALOG_WIDTH = '950px';
const DATA_SERIES_NAME_WIDTH = '140px';
const DATA_SERIES_LIFECYCLE_WIDTH = '310px';
const DATA_SERIES_TYPE_WIDTH = '130px';
const DATA_SERIES_AXIS_WIDTH = '60px';
const DATA_SERIES_COUNT_WIDTH = '130px';

class ConfigureDialog extends Component {

	constructor(props) {
		super(props);
		this.configStore = null; // set during opening a configure dialog (see render)
		// bindings
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._handleFactsheetTypeSelect = this._handleFactsheetTypeSelect.bind(this);
		this._updateLifecycleVars = this._updateLifecycleVars.bind(this);
		this._mayCorrectConfigStore = this._mayCorrectConfigStore.bind(this);
		this._handleStartYearDistanceInput = this._handleStartYearDistanceInput.bind(this);
		this._handleEndYearDistanceInput = this._handleEndYearDistanceInput.bind(this);
		this._handleXAxisUnitSelect = this._handleXAxisUnitSelect.bind(this);
		this._handleYAxisLabelInput = this._handleYAxisLabelInput.bind(this);
		this._handleY2AxisLabelInput = this._handleY2AxisLabelInput.bind(this);
		this._handleDataSeriesNameInput = this._handleDataSeriesNameInput.bind(this);
		this._handleDataSeriesLifecyclesMultiSelect = this._handleDataSeriesLifecyclesMultiSelect.bind(this);
		this._handleDataSeriesTypeSelect = this._handleDataSeriesTypeSelect.bind(this);
		this._handleDataSeriesCountSelect = this._handleDataSeriesCountSelect.bind(this);
		this._handleDataSeriesAxisSelect = this._handleDataSeriesAxisSelect.bind(this);
		this._handleDataSeriesDownButton = this._handleDataSeriesDownButton.bind(this);
		this._handleDataSeriesUpButton = this._handleDataSeriesUpButton.bind(this);
		this._handleDataSeriesRemoveButton = this._handleDataSeriesRemoveButton.bind(this);
		this._handleDataSeriesAddButton = this._handleDataSeriesAddButton.bind(this);
		this._renderContent = this._renderContent.bind(this);
		this._renderDataSeries = this._renderDataSeries.bind(this);
		this._renderSingleDataSeries = this._renderSingleDataSeries.bind(this);
	}

	_handleOnClose() {
		this.configStore = null;
		this.props.onClose();
	}

	_handleOnOK() {
		const tmp = this.configStore;
		this.configStore = null;
		this.props.onOK(tmp);
	}

	_handleFactsheetTypeSelect(option) {
		if (this.configStore.selectedFactsheetType === option.value) {
			return;
		}
		this.configStore.selectedFactsheetType = option.value;
		this._updateLifecycleVars(option.value);
		this._mayCorrectConfigStore();
		this.forceUpdate();
	}

	_updateLifecycleVars(factsheetType) {
		this.lifecycleOptions = Constants.getDataSeriesLifecycleOptions(this.props.setup, factsheetType);
		this.lifecycleModel = this.lifecycleOptions.map((e) => {
			return e.value;
		});
	}

	_mayCorrectConfigStore() {
		const lifecycleModel = this.lifecycleModel;
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
			}).sort(LifecycleUtilities.getSorter(this.lifecycleModel));
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

	_handleDataSeriesCountSelect(index) {
		return (option) => {
			const dataSeries = this.configStore.selectedDataSeries[index];
			if (dataSeries.count === option.value) {
				return;
			}
			dataSeries.count = option.value;
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

	_handleDataSeriesDownButton(index) {
		return (event) => {
			Utilities.swap(this.configStore.selectedDataSeries, index, index + 1);
			this.forceUpdate();
		};
	}

	_handleDataSeriesUpButton(index) {
		return (event) => {
			Utilities.swap(this.configStore.selectedDataSeries, index, index - 1);
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
		this.configStore.selectedDataSeries.push(DataSeries.createDemo(this.lifecycleModel));
		this.forceUpdate();
	}

	render() {
		if (this.props.show) {
			if (!this.configStore) {
				this.configStore = this.props.reportState.getAll();
				this._updateLifecycleVars(this.configStore.selectedFactsheetType);
			}
		}
		return (
			<ModalDialog show={this.props.show}
				width={DIALOG_WIDTH}
				title='Configure'
				content={this._renderContent}
				onClose={this._handleOnClose}
				onOK={this._handleOnOK}
			/>
		);
	}

	_renderContent() {
		const factsheetTypeOptions = this.props.reportState.getAllowedValues('selectedFactsheetType').map((e) => {
			return {
				value: e,
				label: lx.translateFactSheetType(e, 'plural')
			};
		});
		// TODO validation
		return (
			<div>
				<div>
					<div style={{ display: 'inline-block', width: '20%', paddingRight: '5px', verticalAlign: 'top' }}>
						<SelectField id='factsheetType' label='Factsheet type'
							options={factsheetTypeOptions}
							useSmallerFontSize
							value={this.configStore.selectedFactsheetType}
							onChange={this._handleFactsheetTypeSelect} />
					</div>
					<div style={{ display: 'inline-block', width: '30%', paddingLeft: '5px', paddingRight: '5px', verticalAlign: 'top' }}>
						<InputField id='startYearDistance' label='How many years to look in the past?'
							type='number' min='1' max='5'
							useSmallerFontSize
							value={this.configStore.selectedStartYearDistance.toString()}
							onChange={this._handleStartYearDistanceInput} />
					</div>
					<div style={{ display: 'inline-block', width: '30%', paddingLeft: '5px', paddingRight: '5px', verticalAlign: 'top' }}>
						<InputField id='endYearDistance' label='How many years to look in the future?'
							type='number' min='1' max='5'
							useSmallerFontSize
							value={this.configStore.selectedEndYearDistance.toString()}
							onChange={this._handleEndYearDistanceInput} />
					</div>
					<div style={{ display: 'inline-block', width: '20%', paddingLeft: '5px', verticalAlign: 'top' }}>
						<SelectField id='xAxisUnit' label='X axis unit'
							options={Constants.X_AXIS_UNIT_OPTIONS}
							useSmallerFontSize
							value={this.configStore.selectedXAxisUnit}
							onChange={this._handleXAxisUnitSelect} />
					</div>
				</div>
				<div>
					<div style={{ display: 'inline-block', width: '50%', paddingRight: '5px', verticalAlign: 'top' }}>
						<InputField id='yAxisLabel' label='Y axis label'
							type='text'
							useSmallerFontSize
							value={this.configStore.selectedYAxisLabel}
							onChange={this._handleYAxisLabelInput} />
					</div>
					<div style={{ display: 'inline-block', width: '50%', paddingLeft: '5px', verticalAlign: 'top' }}>
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
					<div className='panel-body'>
						{this._renderDataSeries()}
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

	_renderDataSeries() {
		const result = [];
		result.push((
			<div key='headings'>
				<p className='text-center' style={{ display: 'inline-block', width: DATA_SERIES_NAME_WIDTH }}><b>Display name</b></p>
				<div style={{ display: 'inline-block', width: '5px' }} />
				<p className='text-center' style={{ display: 'inline-block', width: DATA_SERIES_LIFECYCLE_WIDTH }}><b>Lifecycles to use</b></p>
				<div style={{ display: 'inline-block', width: '5px' }} />
				<p className='text-center' style={{ display: 'inline-block', width: DATA_SERIES_TYPE_WIDTH }}><b>Type</b></p>
				<div style={{ display: 'inline-block', width: '5px' }} />
				<p className='text-center' style={{ display: 'inline-block', width: DATA_SERIES_AXIS_WIDTH }}><b>Y Axis</b></p>
				<div style={{ display: 'inline-block', width: '5px' }} />
				<p className='text-center' style={{ display: 'inline-block', width: DATA_SERIES_COUNT_WIDTH }}><b>Count</b></p>
				<div style={{ display: 'inline-block', width: '5px' }} />
			</div>
		));
		this.configStore.selectedDataSeries.forEach((e, i, array) => {
			// changes to the second param must be reflected in the _handleDataSeries* methods!
			result.push(this._renderSingleDataSeries(e, i, i === 0, i === array.length - 1));
		});
		return result;
	}

	_renderSingleDataSeries(dataSeries, index, first, last) {
		return (
			<div className='form-inline' key={index} style={{ marginBottom: '5px' }}>
				<InputField id='dataSeriesName' label='Display name'
					type='text'
					width={DATA_SERIES_NAME_WIDTH}
					useSmallerFontSize labelReadOnly
					value={dataSeries.name}
					onChange={this._handleDataSeriesNameInput(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<MultiSelectField id='dataSeriesLifecycles' label='Lifecycles to use'
					width={DATA_SERIES_LIFECYCLE_WIDTH}
					options={this.lifecycleOptions}
					useSmallerFontSize labelReadOnly
					values={dataSeries.lifecycles}
					onChange={this._handleDataSeriesLifecyclesMultiSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesType' label='Type'
					width={DATA_SERIES_TYPE_WIDTH}
					options={Constants.DATA_SERIES_TYPE_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.type}
					onChange={this._handleDataSeriesTypeSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesAxis' label='Y Axis'
					width={DATA_SERIES_AXIS_WIDTH}
					options={Constants.DATA_SERIES_AXIS_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.axis}
					onChange={this._handleDataSeriesAxisSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<SelectField id='dataSeriesCount' label='Count'
					width={DATA_SERIES_COUNT_WIDTH}
					options={Constants.DATA_SERIES_COUNT_OPTIONS}
					useSmallerFontSize labelReadOnly
					value={dataSeries.count}
					onChange={this._handleDataSeriesCountSelect(index)} />
				<div style={{ display: 'inline-block', width: '5px' }} />
				<button type='button'
					className='btn btn-link btn-xs'
					onClick={this._handleDataSeriesDownButton(index)}
					style={{
						visibility: last ? 'hidden' : 'visible'
					}}
				>
					<span className='glyphicon glyphicon-chevron-down' aria-hidden='true' />
				</button>
				<button type='button'
					className='btn btn-link btn-xs'
					onClick={this._handleDataSeriesUpButton(index)}
					style={{
						visibility: first ? 'hidden' : 'visible'
					}}
				>
					<span className='glyphicon glyphicon-chevron-up' aria-hidden='true' />
				</button>
				<button type='button'
					className='btn btn-link btn-xs'
					onClick={this._handleDataSeriesRemoveButton(index)}
					style={{
						visibility: first && last ? 'hidden' : 'visible'
					}}
				>
					<span className='glyphicon glyphicon-trash' aria-hidden='true' />
				</button>
			</div>
		);
	}
}

ConfigureDialog.propTypes = {
	show: PropTypes.bool.isRequired,
	setup: PropTypes.object.isRequired,
	reportState: PropTypes.instanceOf(ReportState).isRequired,
	onClose: PropTypes.func.isRequired,
	onOK: PropTypes.func.isRequired
};

export default ConfigureDialog;