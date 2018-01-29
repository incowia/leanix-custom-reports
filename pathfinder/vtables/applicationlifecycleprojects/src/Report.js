import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import Table from './Table';

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
		this.COST_CENTRE_OPTIONS = {};
		this.DEPLOYMENT_OPTIONS = {};
		this.LIFECYCLE_PHASE_OPTIONS = {};
		this.PROJECT_IMPACT_OPTIONS = {};
		this.DECOMMISSIONING_TYPE_OPTIONS = {};
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
		// get options from data model
		this.LIFECYCLE_PHASE_OPTIONS = Utilities.createOptionsObj(
			Utilities.getLifecycleModel(setup, 'Application'));
		const factsheetModel = setup.settings.dataModel.factSheets.Application;
		this.DEPLOYMENT_OPTIONS = Utilities.createOptionsObjFrom(
			factsheetModel, 'fields.deployment.values');
		const relationModel = setup.settings.dataModel.relations.applicationProjectRelation;
		this.PROJECT_IMPACT_OPTIONS = Utilities.createOptionsObjFrom(
			relationModel, 'fields.projectImpact.values');
		this.DECOMMISSIONING_TYPE_OPTIONS = Utilities.createOptionsObjFrom(
			relationModel, 'fields.projectType.values');
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			this.COST_CENTRE_OPTIONS = Utilities.createOptionsObj(index.getTags('CostCentre'));
			lx.executeGraphQL(this._createQuery(applicationTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery(applicationTagId) {
		const applicationTagIdFilter = applicationTagId ? `, {facetKey: "Application Type", keys: ["${applicationTagId}"]}` : '';
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]}
						${applicationTagIdFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							deployment lifecycle { phases { phase startDate } }
							relApplicationToProject { edges { node { projectImpact projectType factSheet { id } } } }
						}
					}}
				}
				projects: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Project"]}
					]}
				) {
					edges { node { id name tags { name } } }
				}}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
		lx.hideSpinner();
	}

	_handleData(index, applicationTagId) {
		const tableData = [];
		const decommissioningRE = /decommissioning/i;
		const addSubNodes = (subIndex, outputItem, idPrefix, check) => {
			let nothingAdded = true;
			subIndex.nodes.forEach((e) => {
				// access projects
				const project = index.byID[e.id];
				if (!project) {
					return;
				}
				const projectId = project.id;
				const projectName = project.name;
				const projectImpact = e.relationAttr.projectImpact;
				const decommissioningType = e.relationAttr.projectType;
				if (check(projectName, projectImpact)) {
					const copiedItem = Utilities.copyObject(outputItem);
					copiedItem.itemId += '-' + idPrefix + '-' + projectId;
					copiedItem.projectId = projectId;
					copiedItem.projectName = projectName;
					copiedItem.projectImpact = this._getOptionKeyFromValue(
						this.PROJECT_IMPACT_OPTIONS, projectImpact);
					copiedItem.decommissioningType = this._getOptionKeyFromValue(
						this.DECOMMISSIONING_TYPE_OPTIONS, decommissioningType);
					tableData.push(copiedItem);
					nothingAdded = false;
				}
			});
			return nothingAdded;
		};
		index.applications.nodes.forEach((e) => {
			if (!applicationTagId && !index.includesTag(e, 'Application')) {
				return;
			}
			const lifecycles = Utilities.getLifecycles(e);
			const subIndex = e.relApplicationToProject;
			const costCentre = this._getOptionKeyFromValue(
				this.COST_CENTRE_OPTIONS, this._getTagFromGroup(index, e, 'CostCentre'));
			const deployment = this._getOptionKeyFromValue(
				this.DEPLOYMENT_OPTIONS, e.deployment);
			lifecycles.forEach((e2) => {
				const outputItem = {
					itemId: e.id,
					name: e.name,
					id: e.id,
					costCentre: costCentre,
					deployment: deployment,
					projectId: '',
					projectName: '',
					projectImpact: undefined,
					decommissioningType: undefined,
					lifecyclePhase: this._getOptionKeyFromValue(
						this.LIFECYCLE_PHASE_OPTIONS, e2.phase),
					lifecycleStart: new Date(e2.startDate)
				};
				if (!subIndex) {
					// add directly, if no projects
					tableData.push(outputItem);
					return;
				}
				let nothingAdded = true;
				// add duplicates with project information according to lifecycle rules
				switch (e2.phase) {
					case 'plan':
					case 'phaseIn':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project doesn't contain decommissioning in name and impact is 'adds'
							return impact === 'Adds' && !decommissioningRE.test(name);
						});
						break;
					case 'active':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project doesn't contain decommissioning in name and impact is 'adds', 'modifies' or no impact
							return (!impact || impact === 'Adds' || impact === 'Modifies')
								&& !decommissioningRE.test(name);
						});
						break;
					case 'phaseOut':
					case 'endOfLife':
						nothingAdded = addSubNodes(subIndex, outputItem, e2.phase, (name, impact) => {
							// project does contain decommissioning in name or impact is 'sunsets'
							return impact === 'Sunsets' || decommissioningRE.test(name);
						});
						break;
					default:
						throw new Error('Unknown phase: ' + e2.phase);
				}
				if (nothingAdded) {
					// add directly, if no rule applies, but without project information
					tableData.push(outputItem);
				}
			});
		});
		lx.hideSpinner();
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			data: tableData
		});
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
	}

	_getTagFromGroup(index, node, tagGroupName) {
		const tag = index.getFirstTagFromGroup(node, tagGroupName);
		return tag ? tag.name : '';
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
			<Table data={this.state.data}
				options={{
					costCentre: this.COST_CENTRE_OPTIONS,
					deployment: this.DEPLOYMENT_OPTIONS,
					lifecyclePhase: this.LIFECYCLE_PHASE_OPTIONS,
					projectImpact: this.PROJECT_IMPACT_OPTIONS,
					decommissioningType: this.DECOMMISSIONING_TYPE_OPTIONS
				}}
				setup={this.state.setup} />
		);
	}
}

export default Report;
