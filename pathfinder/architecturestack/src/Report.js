import React, { Component } from 'react';
import ReportLoadingState from './common/leanix-reporting-utilities/ReportLoadingState';
import DataIndex from './common/leanix-reporting-utilities/DataIndex';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import TagUtilities from './common/leanix-reporting-utilities/TagUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportState from './common/leanix-reporting-utilities/ReportState';
import SelectField from './common/react-leanix-reporting/SelectField';
import MissingDataAlert from './common/react-leanix-reporting/MissingDataAlert';
import DataHandler from './DataHandler';
import ConfigureDialog from './ConfigureDialog';
import Matrix from './Matrix';

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
		this.axisModels = null; // set during initReport
		this.factsheetTypes = null; // set during initReport
		this.factsheetTypeOptions = null; // set during initReport
		this.viewModel = null; // set during createConfig -> reportViewCallback
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
		this._createAdditionalDataQuery = this._createAdditionalDataQuery.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleData = this._handleData.bind(this);
		this._createUIData = this._createUIData.bind(this);
		this._handleOnClose = this._handleOnClose.bind(this);
		this._handleOnOK = this._handleOnOK.bind(this);
		this._handleDismissAlertButton = this._handleDismissAlertButton.bind(this);
		this._handleAxisSelect = this._handleAxisSelect.bind(this);
		this._handleSwapAxes = this._handleSwapAxes.bind(this);
		this._resetUI = this._resetUI.bind(this);
		this._filterAndMapModelsToViewOptions = this._filterAndMapModelsToViewOptions.bind(this);
		// react state definition (init)
		this.state = {
			loadingState: ReportLoadingState.INIT,
			showConfigure: false,
			missingData: null,
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
		// get all tags, then models and finally the data from facet config
		lx.executeGraphQL(TagUtilities.EXTENDED_ALL_TAG_GROUPS_QUERY).then((tagGroups) => {
			this.index.putGraphQL(tagGroups);
			this.axisModels = DataHandler.createAxisModels(setup, this.factsheetTypes, this.index.tagGroups.byID);
			// get the view infos to check how many views are supported for each factsheet type
			// custom factsheet types might not have any view infos
			lx.executeGraphQL(this._createAllViewInfosQuery()).then((allViewInfos) => {
				const allViewInfoCounts = DataHandler.getViewInfoCounts(this.factsheetTypes, allViewInfos);
				// filter out all factsheet types that have no models and/or no view
				this.factsheetTypes = this.factsheetTypes.filter((factsheetType) => {
					const axisModels = this.axisModels[factsheetType];
					const viewInfoCount = allViewInfoCounts[factsheetType];
					return axisModels && viewInfoCount > 0;
				});
				if (!this.factsheetTypes || this.factsheetTypes.length === 0) {
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
						 only happens in dev mode, which is a rare case
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
			// reset select states for view & axes, b/c factsheet type changed
			this.reportState.reset('selectedXAxis');
			this.reportState.reset('selectedYAxis');
			delete newState.selectedXAxis;
			delete newState.selectedYAxis;
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
		const models = this.axisModels[factsheetType];
		// axis models have at least 2 elements, see '_initReport'
		// x & y axes should differ
		this.reportState.prepareComplexEnumValue('selectedXAxis', models, this._getModelKey, models[0]);
		this.reportState.prepareComplexEnumValue('selectedYAxis', models, this._getModelKey, models[1]);
	}

	_getModelKey(model) {
		return model.key;
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
			reportViewFactSheetType: selectedFactsheetType,
			reportViewCallback: (data) => {
				this._resetUI();
				this.viewModel = DataHandler.createViewModel(data);
				// get new data and re-render
				this._handleData();
			},
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
						viewInfos { key }
					}`;
		}).join('\n');
		return `{${query}}`;
	}

	_createAdditionalDataQuery(ids, factsheetType, attributes) {
		// create ids string, but pay attention to server-side limitation of 1024 entries
		const idsString = ids.length < 1025 ? ids.map((e) => {
			return '"' + e.id + '"';
		}).join(',') : undefined;
		// use either ids or at least the factsheet type for the filter
		const idFilter = idsString ? `filter: { ids: [${idsString}] }`
			: (factsheetType ? `filter: {facetFilters: [{facetKey: "FactSheetTypes", keys: ["${factsheetType}"]}]}` : '');
		let attributeDef = 'id ' + attributes.filter((e, i) => {
			// avoid duplicates
			return attributes.indexOf(e, i + 1) < 0;
		}).join(' ');
		if (factsheetType) {
			attributeDef = `...on ${factsheetType} { ${attributeDef} }`;
		}
		return `{additional: allFactSheets(${idFilter}) {
					edges { node {
						${attributeDef}
					}}
				}}`;
	}

	_handleError(err) {
		lx.hideSpinner();
		console.error(err);
		this.setState({
			loadingState: ReportLoadingState.ERROR
		});
	}

	_handleData() {
		/*
			1. remove previous data
			2. get data values
			3. create new values for UI
		*/
		if (!this.index.last || !this.viewModel) {
			return;
		}
		lx.showSpinner('Loading data...');
		const factsheetType = this.reportState.get('selectedFactsheetType');
		const xAxisModel = this.reportState.get('selectedXAxis');
		const yAxisModel = this.reportState.get('selectedYAxis');
		const attributes = [];
		attributes.push(DataHandler.getQueryAttribute(xAxisModel));
		attributes.push(DataHandler.getQueryAttribute(yAxisModel));
		const additionalDataQuery = this._createAdditionalDataQuery(
			this.index.last.nodes,
			factsheetType,
			attributes);
		lx.executeGraphQL(additionalDataQuery).then((additionalData) => {
			this.index.remove('additional');
			this.index.putGraphQL(additionalData);
			this._createUIData();
		}).catch(this._handleError);
	}

	_createUIData() {
		const data = DataHandler.create(this.reportState.get('selectedFactsheetType'),
			{
				view: this.viewModel,
				xAxis: this.reportState.get('selectedXAxis'),
				yAxis: this.reportState.get('selectedYAxis')
			}, {
				nodes: this.index.last.nodes,
				additionalNodeData: this.index.additional.byID,
				tagGroups: this.index.tagGroups.byID
			});
		lx.hideSpinner();
		this.setState({
			loadingState: ReportLoadingState.SUCCESSFUL,
			missingData: data.missing,
			matrixData: data.matrix,
			matrixDataAvailable: data.matrixDataAvailable
		});
		// publish report state to the framework here, b/c nearly all changes trigger this method
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
			configureErrors: null
		});
		if (oldSFT === this.reportState.get('selectedFactsheetType')) {
			// no need to update report config
			// publish call is special here, b/c this action doesn't trigger '_createUIData'
			this.reportState.publish();
			return true;
		}
		// new factsheet type means also new view data
		this.viewModel = null;
		// update report config, this will trigger the facet callback automatically
		lx.updateConfiguration(this._createConfig());
		return true;
	}

	_handleDismissAlertButton() {
		this.reportState.set('showMissingDataWarning', false);
		this.reportState.publish();
		this.forceUpdate();
	}

	_handleAxisSelect(axisReportStateName) {
		return (option) => {
			const axis = this.reportState.get(axisReportStateName);
			if (axis.key === option.value) {
				return;
			}
			const models = this.axisModels[this.reportState.get('selectedFactsheetType')];
			const model = models.find((e) => {
				return e.key === option.value;
			});
			this.reportState.set(axisReportStateName, model);
			this._resetUI();
			this._handleData();
		};
	}

	_handleSwapAxes() {
		this.reportState.update({
			selectedXAxis: this.reportState.get('selectedYAxis'),
			selectedYAxis: this.reportState.get('selectedXAxis')
		});
		this._createUIData();
	}

	_resetUI() {
		this.setState({
			loadingState: ReportLoadingState.NEW_DATA,
			showConfigure: false,
			missingData: null,
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
		const factsheetType = this.reportState.get('selectedFactsheetType');
		return (
			<div>
				{this._renderSelectFields(factsheetType)}
				{this._renderProcessingStep('Initialise report...')}
				<div id='content' />
			</div>
		);
	}

	_renderProcessingStep(stepInfo) {
		return (<h4 className='text-center' dangerouslySetInnerHTML={{ __html: stepInfo }} />);
	}

	_renderLoading() {
		const factsheetType = this.reportState.get('selectedFactsheetType');
		return (
			<div>
				{this._renderSelectFields(factsheetType)}
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
				<MissingDataAlert
					show={this.reportState.get('showMissingDataWarning')}
					data={this.state.missingData}
					onClose={this._handleDismissAlertButton}
					factsheetType={factsheetType}
					setup={this.setup} />
				<div id='content'>
					<Matrix setup={this.setup} cellWidth='180px'
						factsheetType={factsheetType}
						data={this.state.matrixData}
						dataAvailable={this.state.matrixDataAvailable}
						showEmptyRows={this.reportState.get('showEmptyRows')}
						showEmptyColumns={this.reportState.get('showEmptyColumns')} />
				</div>
			</div>
		);
	}

	_mapModelsToViewOptions(model) {
		return {
			value: model.key,
			label: model.label
		};
	}

	_filterAndMapModelsToViewOptions(models, filter) {
		const result = [];
		models.forEach((model) => {
			if (filter(model)) {
				result.push(this._mapModelsToViewOptions(model));
			}
		});
		return result;
	}

	_renderSelectFields(factsheetType) {
		let xAxisOption = undefined;
		let yAxisOption = undefined;
		let xAxisOptions = [];
		let yAxisOptions = [];
		if (factsheetType) {
			xAxisOption = this.reportState.get('selectedXAxis').key;
			yAxisOption = this.reportState.get('selectedYAxis').key;
			const models = this.axisModels[factsheetType];
			xAxisOptions = this._filterAndMapModelsToViewOptions(models, (model) => {
				// remove selected y axis from x axis options
				return model.key !== yAxisOption;
			});
			yAxisOptions = this._filterAndMapModelsToViewOptions(models, (model) => {
				// remove selected x axis from y axis options
				return model.key !== xAxisOption;
			});
		}
		const errors = this.state.configureErrors ? this.state.configureErrors : {};
		const disabled = this.state.loadingState !== ReportLoadingState.SUCCESSFUL;
		return (
			<div>
				<span style={SELECT_FIELD_STYLE}>
					<SelectField id='x-axis' label='X-Axis'
						options={xAxisOptions}
						useSmallerFontSize
						disabled={disabled}
						value={xAxisOption}
						onChange={xAxisOptions && xAxisOptions.length === 0 ? undefined : this._handleAxisSelect('selectedXAxis')}
						hasError={errors.selectedXAxis ? true : false}
						helpText={errors.selectedXAxis} />
				</span>
				<span style={SWAP_BUTTON_STYLE}>
					<button type='button' className='btn btn-link btn-xs'
						aria-label='Swap axes' title='Swap axes'
						disabled={disabled || (xAxisOptions && xAxisOptions.length < 1) || (yAxisOptions && yAxisOptions.length < 1)}
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
						disabled={disabled}
						value={yAxisOption}
						onChange={yAxisOptions && yAxisOptions.length === 0 ? undefined : this._handleAxisSelect('selectedYAxis')}
						hasError={errors.selectedYAxis ? true : false}
						helpText={errors.selectedYAxis} />
				</span>
			</div>
		);
	}
}

export default Report;
