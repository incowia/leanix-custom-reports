import React, { Component } from 'react';
import DataHandler from './DataHandler';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import ConfigureDialog from './ConfigureDialog';
import Constants from './Constants';

const SELECT_FIELD_STYLE = {
	width: '250px',
	display: 'inline-block',
	verticalAlign: 'top',
	marginRight: '1em'
};

const SWAP_BUTTON_STYLE = {
	display: 'inline-block',
	verticalAlign: 'top',
	marginTop: '1.5em',
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
		this._createConfig = this._createConfig.bind(this);
		this._createAllViewInfosQuery = this._createAllViewInfosQuery.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._resetUI = this._resetUI.bind(this);
		// react state definition (init)
		this.state = {
			loadingState: ReportLoadingState.LOADING_INIT,
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
				// extract viewInfos
				// TODO
				// filter out all that have less than 2 elements
				// TODO
				// filter out all invalid factsheet types
				this.factsheetTypes = this.factsheetTypes.filter((e) => {
					// TODO
					return true;
				});
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
				// TODO
				//this.reportState.prepareEnumValue('selectedView', , );
				//this.reportState.prepareEnumValue('selectedXAxis', , );
				//this.reportState.prepareEnumValue('selectedYAxis', , );
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
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_updateReportState(newState) {
		try {
			this.reportState.update(newState);
		} catch (err) {
			return err;
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
						viewInfos { key label type }
					}`;
		}).join('\n');
		return `{${query}}`;
	}

	_createViewQuery(factsheetType, viewKey) { // TODO data handler?
		return `{view(
					key: "${viewKey}",
					filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]}
				) {
					legendItems { id value bgColor color transparency inLegend }
				}}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: ReportLoadingState.ERROR
		});
	}

	_handleData() {
		const data = DataHandler.create();
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL
		});
		// publish report state to the framework here, b/c all changes always trigger this method
		this.reportState.publish();
	}

	_createAdditionalDataQuery(ids, factsheetType, attributes) { // TODO data handler?
		// create ids string, but pay attention to server-side limitation of 1024 entries
		const idsString = ids.length < 1025 ? ids.map((e) => {
			return '"' + e.id + '"';
		}).join(',') : undefined;
		// use either ids or at least the factsheet type for the filter
		const idFilter = idsString ? `(filter: { ids: [${idsString}] })`
			: (factsheetType ? `(filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]})` : '');
		let attributeDef = 'id ' + attributes.filter((e, i) => {
			// avoid duplicates
			return attributes.indexOf(e, i + 1) < 0;
		}).join(' ');
		if (factsheetType) {
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		return `{additionalData: allFactSheets${idFilter} {
					edges { node {
						${attributeDef}
					}}
				}}`;
	}

	_getAndHandleViewData() { // TODO data handler?
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (this.reportState.viewModel && this.reportState.viewModel._key === viewOption.value) {
			// no need to query the same data again
			this._computeData();
			return;
		}
		lx.executeGraphQL(this._createViewQuery(factsheetType, viewOption.key)).then((viewData) => {
			const legendItems = Utilities.getFrom(viewData, 'view.legendItems');
			this.reportState.viewModel = legendItems.reduce((acc, e) => {
				acc[e.value] = e;
				return acc;
			}, {});
			this.reportState.viewModel._rawLegendItems = legendItems;
			this.reportState.viewModel._key = viewOption.value;
			this._computeData();
		}).catch(this._handleError);
	}

	_computeData() { // TODO data handler?
		const setup = this.setup;
		const index = this.index;
		const facetData = this.reportState.lastFacetData;
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		const viewModel = this.reportState.viewModel;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		// create legend data
		const legendData = [];
		viewModel._rawLegendItems.forEach((e) => {
			if (!e.inLegend) {
				return;
			}
			legendData.push({
				label: () => {
					// TODO remove hack
					// see https://github.com/leanix/leanix-reporting/issues/7
					if (e.value === '__missing__') {
						return 'n/a';
					}
					return lx.translateFieldValue(factsheetType, viewOption.value, e.value);
				},
				bgColor: e.bgColor,
				color: e.color
			});
		});
		// create matrixData
		const xAxisValues = this._getDataValues(xAxisOption);
		const yAxisValues = this._getDataValues(yAxisOption);
		const matrixData = []; // position (0,0) will always be empty
		// the first row contains the values from the x axis option
		if (xAxisOption.type === 'TAG') {
			matrixData.push([undefined].concat(xAxisValues.map((e) => {
				return e;
			})));
		} else {
			matrixData.push([undefined].concat(xAxisValues.map((e) => {
				return lx.translateFieldValue(factsheetType, xAxisOption.value, e);
			})));
		}
		if (yAxisOption.type === 'TAG') {
			yAxisValues.forEach((e) => {
				// extend the row with empty arrays for later use
				matrixData.push([e].concat(xAxisValues.map(() => {
					// all other rows contain the values from the y axis option as their first value
					return [];
				})));
			});
		} else {
			yAxisValues.forEach((e) => {
				// extend the row with empty arrays for later use
				matrixData.push([lx.translateFieldValue(factsheetType, yAxisOption.value, e)].concat(xAxisValues.map(() => {
					// all other rows contain the values from the y axis option as their first value
					return [];
				})));
			});
		}
		// now add the data
		let matrixDataAvailable = false;
		const missingData = [];
		facetData.forEach((e) => {
			const id = e.id;
			const additionalData = index.additionalData.byID[id];
			// get the data values
			const xValue = this._getValue(xAxisOption, additionalData);
			const yValue = this._getValue(yAxisOption, additionalData);
			if (!xValue || !yValue) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: this._createMissingDataMsgForValues(xValue, yValue, xAxisOption.label, yAxisOption.label)
				});
				return;
			}
			// determine the coordinates (+1 for both since 0 positions are reserved)
			let x = xAxisValues.indexOf(xValue) + 1;
			let y = yAxisValues.indexOf(yValue) + 1;
			if (x < 1 || y < 1) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: this._createMissingDataMsgForCoordinates(x, y, xValue, yValue, xAxisOption.label, yAxisOption.label)
				});
				return;
			}
			// determine view model for the label
			const itemViewModel = this._getViewModel(viewOption, additionalData);
			if (!itemViewModel || !itemViewModel.inLegend) {
				missingData.push({
					id: e.id,
					name: e.displayName,
					reason: this._createMissingDataMsgForIVMs(viewOption, itemViewModel ? itemViewModel.inLegend : true)
				});
				return;
			}
			matrixDataAvailable = true;
			matrixData[y][x].push({
				id: id,
				name: e.displayName,
				viewModel: itemViewModel
			});
		});
		lx.hideSpinner();
		this.setState({
			legendData: legendData,
			matrixData: matrixData,
			matrixDataAvailable: matrixDataAvailable,
			missingData: missingData,
			loadingState: LOADING_SUCCESSFUL
		});
		// everytime save the state, b/c this method is called, when something
		// changes which needs to be published
		this._publishStateToFramework();
	}

	_createMissingDataMsgForValues(xValue, yValue, xAxisName, yAxisName) { // TODO data handler?
		if (!xValue && !yValue) {
			return 'Values for ' + xAxisName + ' & '
				+ yAxisName + ' are missing.';
		}
		if (!xValue) {
			return 'Value for ' + xAxisName + ' is missing.';
		} else {
			return 'Value for ' + yAxisName + ' is missing.';
		}
	}

	_createMissingDataMsgForCoordinates(x, y, xValue, yValue, xAxisName, yAxisName) { // TODO data handler?
		if (x < 1 && y < 1) {
			return 'Unknown values for ' + xAxisName + ' (' + xValue + ') & '
				+ yAxisName + ' (' + yValue + ').';
		}
		if (x < 1) {
			return 'Unknown value for ' + xAxisName + ' (' + xValue + ').';
		} else {
			return 'Unknown value for ' + yAxisName + ' (' + yValue + ').';
		}
	}

	_createMissingDataMsgForIVMs(viewOption, inLegend) { // TODO data handler?
		if (!inLegend) {
			return 'Value for view is marked as hidden.';
		}
		return 'There are no values defined for the selected view (' + viewOption.label + ').';
	}

	_checkFieldType(type) { // TODO data handler?
		switch (type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
			case 'TAG':
			case 'SINGLE_SELECT':
				return true;
			default:
				console.error('_checkFieldType: Unknown type "' + type + '", which can not be handled by this report!');
				return false;
		}
	}

	_getQueryAttribute(fieldName, type) { // TODO data handler?
		switch (type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
				return fieldName + ' { asString }';
			case 'TAG':
				return 'tags { name }';
			case 'SINGLE_SELECT':
				return fieldName;
			default:
				console.error('_getQueryAttribute: Unknown type "' + type + '" of data field "' + fieldName + '"!');
				return fieldName;
		}
	}

	_getValue(option, additionalData) { // TODO data handler?
		const index = this.index;
		switch (option.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
				const lifecycleData = additionalData[option.value];
				if (!lifecycleData) {
					return;
				}
				return lifecycleData.asString;
			case 'SINGLE_SELECT':
				const dataValue = additionalData[option.value];
				if (!dataValue) {
					return;
				}
				return dataValue;
			case 'TAG':
				const tags = index.getTagsFromGroup(additionalData, option.originalLabel);
				if (tags.length === 0) {
					return;
				}
				return tags[0].name;
			default:
				console.error('_getValue: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return;
		}
	}

	_getViewModel(viewOption, additionalData) { // TODO data handler?
		const index = this.index;
		const viewModel = this.reportState.viewModel;
		switch (viewOption.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
				const lifecycleData = additionalData[viewOption.value];
				if (!lifecycleData) {
					return viewModel['__missing__'];
				}
				return viewModel[lifecycleData.asString];
			case 'SINGLE_SELECT':
				const dataValue = additionalData[viewOption.value];
				if (!dataValue) {
					return viewModel['__missing__'];
				}
				return viewModel[dataValue];
			case 'TAG':
				const tags = index.getTagsFromGroup(additionalData, viewOption.originalLabel);
				if (tags.length === 0) {
					return viewModel['__missing__'];
				}
				return viewModel[tags[0].name];
			default:
				console.error('_getViewModel: Unknown type in "' + viewOption.type + '" of data field "' + viewOption.value + '"!');
				return viewModel['__missing__'];
		}
	}

	_getDataValues(option) { // TODO data handler?
		const factsheetType = this.reportState.selectedFactsheetType;
		const index = this.index;
		const setup = this.setup;
		switch (option.type) {
			case 'LIFECYCLE':
			case 'PROJECT_STATUS':
			case 'SINGLE_SELECT':
				return Utilities.getFrom(setup, 'settings.dataModel.factSheets.'
					+ factsheetType + '.fields.' + option.value + '.values');
			case 'TAG':
				const tagGroup = index.tagGroups.byID[option.value];
				if (!tagGroup) {
					return [];
				}
				const tags = tagGroup.tags;
				if (!tags) {
					return [];
				}
				return tags.nodes.map((e) => {
					return e.name;
				});
			default:
				console.error('_getDataValues: Unknown type in "' + option.type + '" of data field "' + option.value + '"!');
				return Utilities.getFrom(setup, 'settings.dataModel.factSheets.'
					+ factsheetType + '.fields.' + option.value + '.values');
		}
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
			// no need to update report config
			// publish call is special here, b/c this action doesn't trigger '_handleData'
			this.reportState.publish();
			return true;
		}
		// reset all select states, b/c factsheet type changed
		// TODO
		// update report config, this will trigger the facet callback automatically
		lx.updateConfiguration(this._createConfig());
		return true;
	}

	_handleViewSelect(val) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const viewOption = this._getSelectedViewOption(factsheetType);
		if (viewOption.value === val.value) {
			return;
		}
		this.reportState.selectedView = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_handleXAxisSelect(val) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		if (xAxisOption.value === val.value) {
			return;
		}
		this.reportState.selectedXAxis = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_handleYAxisSelect(val) {
		const factsheetType = this.reportState.selectedFactsheetType;
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		if (yAxisOption.value === val.value) {
			return;
		}
		this.reportState.selectedYAxis = val;
		this._resetUIState();
		this._getAndHandleAdditionalData();
	}

	_handleSwapAxes() {
		const factsheetType = this.reportState.selectedFactsheetType;
		const xAxisOption = this._getSelectedXAxisOption(factsheetType);
		const yAxisOption = this._getSelectedYAxisOption(factsheetType);
		this.reportState.selectedXAxis = yAxisOption;
		this.reportState.selectedYAxis = xAxisOption;
		this._computeData();
	}

	_handleDismissAlertButton() {
		// set directly b/c 'setState' works async
		this.state.showMissingDataWarning = false;
		// publish call is special here, b/c this action doesn't trigger '_computeData'
		this._publishStateToFramework();
		// now trigger rendering
		this.setState({
			showMissingDataWarning: false
		});
	}

	_getSelectedViewOption(factsheetType) {
		if (!this.reportState.selectedView) {
			// always fallback to the first one
			return this.reportState.viewOptions[factsheetType][0];
		}
		return this.reportState.selectedView;
	}

	_getSelectedXAxisOption(factsheetType) {
		if (!this.reportState.selectedXAxis) {
			const viewOptions = this.reportState.viewOptions[factsheetType];
			// view options have at least 2 elements, see '_initReport'
			switch (viewOptions.length) {
				case 2:
					return viewOptions[0];
				default:
					return viewOptions[1];
			}
		}
		return this.reportState.selectedXAxis;
	}

	_getSelectedYAxisOption(factsheetType) {
		if (!this.reportState.selectedYAxis) {
			const viewOptions = this.reportState.viewOptions[factsheetType];
			// view options have at least 2 elements, see '_initReport'
			// choose an option which is different from x-axis
			switch (viewOptions.length) {
				case 2:
					return viewOptions[1];
				default:
					return viewOptions[2];
			}
		}
		return this.reportState.selectedYAxis;
	}

	_resetUI() {
		// do not reset all states!
		this.setState({
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
				{this._renderSelectFields()}
				<MissingDataAlert
					show={this.state.showMissingDataWarning}
					missingData={this.state.missingData}
					onClose={this._handleDismissAlertButton}
					factsheetType={factsheetType}
					setup={this.setup} />
				<div id='content'>
					<Legend items={this.state.legendData} itemWidth='150px' />
					<br />
					<Matrix setup={this.setup} cellWidth='180px'
						factsheetType={factsheetType}
						data={this.state.matrixData}
						dataAvailable={this.state.matrixDataAvailable}
						showEmptyRows={this.state.showEmptyRows}
						showEmptyColumns={this.state.showEmptyColumns}
					/>
				</div>
			</div>
		);
	}

	_renderSelectFields() {
		const factsheetType = this.reportState.get('selectedFactsheetType');
		let viewOptions = [];
		let xAxisOptions = [];
		let yAxisOptions = [];
		let selectedViewOption = undefined;
		let selectedXAxisOption = undefined;
		let selectedYAxisOption = undefined;
		if (factsheetType) {
			viewOptions = this.reportState.viewOptions[factsheetType];
			selectedViewOption = this._getSelectedViewOption(factsheetType).value;
			selectedXAxisOption = this._getSelectedXAxisOption(factsheetType).value;
			selectedYAxisOption = this._getSelectedYAxisOption(factsheetType).value;
			xAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
				// remove selected options from y axis options
				return e.value !== selectedYAxisOption;
			});
			yAxisOptions = Utilities.copyArray(viewOptions).filter((e) => {
				// remove selected options from x axis options
				return e.value !== selectedXAxisOption;
			});
		}
		return (
			<div>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='view' label='View' options={viewOptions} useSmallerFontSize
						value={selectedViewOption} onChange={viewOptions && viewOptions.length === 0 ? undefined : this._handleViewSelect} />
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='x-axis' label='X-Axis' options={xAxisOptions} useSmallerFontSize
						value={selectedXAxisOption} onChange={xAxisOptions && xAxisOptions.length === 0 ? undefined : this._handleXAxisSelect} />
				</span>
				<span style={SWAP_BUTTON_STYLE}>
					<button type='button' className='btn btn-default btn-xs'
						aria-label='Swap axes' title='Swap axes'
						disabled={(xAxisOptions && xAxisOptions.length < 1) || (yAxisOptions && yAxisOptions.length < 1)}
						onClick={this._handleSwapAxes}
					>
						<span className='glyphicon glyphicon-retweet' aria-hidden='true' />
						<span className='sr-only'>Swap axes</span>
					</button>
				</span>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='y-axis' label='Y-Axis' options={yAxisOptions} useSmallerFontSize
						value={selectedYAxisOption} onChange={yAxisOptions && yAxisOptions.length === 0 ? undefined : this._handleYAxisSelect} />
				</span>
			</div>
		);
	}
}

export default Report;
