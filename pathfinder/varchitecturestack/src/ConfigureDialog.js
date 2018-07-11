import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import ModalDialog from './common/react-leanix-reporting/ModalDialog';
import SelectField from './common/react-leanix-reporting/SelectField';
import Checkbox from './common/react-leanix-reporting/Checkbox';

const DIALOG_WIDTH = '500px';

class ConfigureDialog extends Component {

	constructor(props) {
		super(props);
		this.configStore = null; // set during opening a configure dialog (see render)
		// bindings
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._handleFactsheetTypeSelect = this._handleFactsheetTypeSelect.bind(this);
		this._handleShowEmptyRowsCheck = this._handleShowEmptyRowsCheck.bind(this);
		this._handleShowEmptyColumnsCheck = this._handleShowEmptyColumnsCheck.bind(this);
		this._handleShowMissingDataWarningCheck = this._handleShowMissingDataWarningCheck.bind(this);
		this._renderContent = this._renderContent.bind(this);
	}

	_handleOnClose() {
		this.configStore = null;
		this.props.onClose();
	}

	_handleOnOK() {
		const tmp = this.configStore;
		this.configStore = null;
		if (!this.props.onOK(tmp)) {
			// dialog will not be closed, therefore preserve current configStore
			this.configStore = tmp;
		}
	}

	_handleFactsheetTypeSelect(option) {
		if (this.configStore.selectedFactsheetType === option.value) {
			return;
		}
		this.configStore.selectedFactsheetType = option.value;
		this.forceUpdate();
	}

	_handleShowEmptyRowsCheck(val) {
		if (this.configStore.showEmptyRows === !val) {
			return;
		}
		this.configStore.showEmptyRows = !val;
		this.forceUpdate();
	}

	_handleShowEmptyColumnsCheck(val) {
		if (this.configStore.showEmptyColumns === !val) {
			return;
		}
		this.configStore.showEmptyColumns = !val;
		this.forceUpdate();
	}

	_handleShowMissingDataWarningCheck(val) {
		if (this.configStore.showMissingDataWarning === val) {
			return;
		}
		this.configStore.showMissingDataWarning = val;
		this.forceUpdate();
	}

	render() {
		if (this.props.show) {
			if (!this.configStore) {
				this.configStore = this.props.reportState.get();
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
		const errors = this.props.errors ? this.props.errors : {};
		return (
			<div>
				<SelectField id='factsheetType' label='Factsheet type'
					options={this.props.factsheetTypes}
					useSmallerFontSize
					value={this.configStore.selectedFactsheetType}
					onChange={this._handleFactsheetTypeSelect}
					hasError={errors.selectedFactsheetType ? true : false}
					helpText={errors.selectedFactsheetType} />
				<Checkbox id='showEmptyRows' label='Hide empty rows'
					useSmallerFontSize
					value={!this.configStore.showEmptyRows}
					onChange={this._handleShowEmptyRowsCheck}
					hasError={errors.showEmptyRows ? true : false}
					helpText={errors.showEmptyRows} />
				<Checkbox id='showEmptyColumns' label='Hide empty columns'
					useSmallerFontSize
					value={!this.configStore.showEmptyColumns}
					onChange={this._handleShowEmptyColumnsCheck}
					hasError={errors.showEmptyColumns ? true : false}
					helpText={errors.showEmptyColumns} />
				<Checkbox id='showMissingDataWarning' label='Show missing data warning'
					useSmallerFontSize
					value={this.configStore.showMissingDataWarning}
					onChange={this._handleShowMissingDataWarningCheck}
					hasError={errors.showMissingDataWarning ? true : false}
					helpText={errors.showMissingDataWarning} />
			</div>
		);
	}
}

ConfigureDialog.propTypes = {
	show: PropTypes.bool.isRequired,
	setup: PropTypes.object.isRequired,
	reportState: PropTypes.instanceOf(ReportState).isRequired,
	factsheetTypes: PropTypes.arrayOf(
		PropTypes.shape({
			value: PropTypes.string.isRequired,
			label: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	onClose: PropTypes.func.isRequired,
	onOK: PropTypes.func.isRequired,
	errors: PropTypes.object
};

export default ConfigureDialog;