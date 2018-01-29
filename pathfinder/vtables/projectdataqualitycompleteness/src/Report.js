import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

const RULE_OPTIONS = Utilities.createOptionsObj(
	RuleSet.singleRules.concat(RuleSet.overallRule));

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderAdditionalNotes = this._renderAdditionalNotes.bind(this);
		this.MARKET_OPTIONS = {};
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
		// get all tags, then the data
		lx.executeGraphQL(CommonQueries.tagGroups).then((tagGroups) => {
			const index = new DataIndex();
			index.put(tagGroups);
			lx.executeGraphQL(this._createQuery()).then((data) => {
				index.put(data);
				this._handleData(index);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_createQuery() {
		return `{projects: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Project"]}
					]}
				){
					edges { node {
        				id name tags { name }
						... on Project {
							lifecycle { phases { phase startDate } }
							relProjectToApplication { edges { node { projectImpact projectType factSheet { id } }}}
							relProjectToUserGroup { edges { node { factSheet { id } }}}
						}
        			}}
        		}}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
		lx.hideSpinner();
	}

	_handleData(index) {
		const tableData = [];
		let additionalNotesMarker = 0;
		const additionalNotes = RuleSet.singleRules.reduce((obj, e) => {
			if (e.additionalNote) {
				obj[e.name] = {
					marker: additionalNotesMarker++,
					note: e.additionalNote
				};
			}
			return obj;
		}, {});
		// group projects by market and attach unknown market
		const groupResult = this._groupByMarket(index.projects.nodes);
		const groupedByMarket = groupResult.groups;
		groupedByMarket.unknown = groupResult.unknown;
		this.MARKET_OPTIONS = groupResult.options;
		this.MARKET_OPTIONS[groupResult.count++] = 'unknown';
		const ruleConfig = {};
		for (let market in groupedByMarket) {
			ruleConfig.market = market;
			const allProjects = groupedByMarket[market];
			// process single rules
			const compliants = {};
			const nonCompliants = {};
			allProjects.forEach((e) => {
				RuleSet.singleRules.forEach((e2) => {
					if (!compliants[e2.name]) {
						compliants[e2.name] = [];
						nonCompliants[e2.name] = [];
					}
					if (!e2.appliesTo(index, e)) {
						return;
					}
					const ruleResult = e2.compute(index, e, ruleConfig);
					if (ruleResult) {
						compliants[e2.name].push(e);
					} else {
						nonCompliants[e2.name].push(e);
					}
				});
			});
			// add results to tableData
			RuleSet.singleRules.forEach((e) => {
				const compliant = compliants[e.name].length;
				const nonCompliant = nonCompliants[e.name].length;
				tableData.push({
					id: market + '-' + e.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, e.name),
					overallRule: false,
					compliant: compliant,
					compliantPrjs: compliants[e.name].map((e2) => {
						return e2.name;
					}),
					compliantPrjIds: compliants[e.name].map((e2) => {
						return e2.id;
					}),
					nonCompliant: nonCompliant,
					nonCompliantPrjs: nonCompliants[e.name].map((e2) => {
						return e2.name;
					}),
					nonCompliantPrjIds: nonCompliants[e.name].map((e2) => {
						return e2.id;
					}),
					percentage: this._computePercentage(compliant, nonCompliant)
				});
			});
			// process overall rule
			const overallRuleResult = RuleSet.overallRule.compute(compliants, nonCompliants, ruleConfig);
			tableData.push({
				id: market + '-' + RuleSet.overallRule.name,
				market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
				rule: this._getOptionKeyFromValue(RULE_OPTIONS, RuleSet.overallRule.name),
				overallRule: true,
				compliant: overallRuleResult.compliant,
				compliantPrjs: [],
				compliantPrjIds: [],
				nonCompliant: overallRuleResult.nonCompliant,
				nonCompliantPrjs: [],
				nonCompliantPrjIds: [],
				percentage: this._computePercentage(overallRuleResult.compliant, overallRuleResult.nonCompliant)
			});
		}
		lx.hideSpinner();
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			data: tableData,
			additionalNotes: additionalNotes
		});
	}

	_groupByMarket(nodes, additionalFilter) {
		let marketCount = 0;
		const groupedByMarket = {};
		const marketOptions = {};
		const unknownMarkets = [];
		nodes.forEach((e) => {
			if (additionalFilter && additionalFilter(e)) {
				return;
			}
			let market = Utilities.getMarket(e);
			if (!market) {
				unknownMarkets.push(e);
				return;
			}
			if (!groupedByMarket[market]) {
				groupedByMarket[market] = [];
				marketOptions[marketCount++] = market;
			}
			groupedByMarket[market].push(e);
		});
		return {
			count: marketCount,
			groups: groupedByMarket,
			options: marketOptions,
			unknown: unknownMarkets
		};
	}

	_computePercentage(compliant, nonCompliant) {
		const sum = compliant + nonCompliant;
		let percentage = undefined;
		if (sum === 0) {
			percentage = Number.NaN;
		} else if (compliant > 0 && nonCompliant === 0) {
			percentage = 100;
		} else if (compliant === 0 && nonCompliant > 0) {
			percentage = 0;
		} else {
			// note: floor cuts the post comma digits (rounding down)
			percentage = Math.floor(compliant * 100 / sum);
		}
		return percentage;
	}

	_getOptionKeyFromValue(options, value) {
		if (!value) {
			return undefined;
		}
		const key = Utilities.getKeyToValue(options, value);
		return key !== undefined && key !== null ? parseInt(key, 10) : undefined;
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
			<div>
				<Table data={this.state.data}
					additionalNotes={this.state.additionalNotes}
					options={{
						market: this.MARKET_OPTIONS,
						rule: RULE_OPTIONS
					}}
					pageSize={RuleSet.ruleCount}
					setup={this.state.setup} />
				{this._renderAdditionalNotes()}
			</div>
		);
	}

	_renderAdditionalNotes() {
		const arr = [];
		for (let key in this.state.additionalNotes) {
			const additionalNote = this.state.additionalNotes[key];
			arr[additionalNote.marker] = additionalNote.note;
		}
		return (
			<div className='small'>
				<p>In general, projects need to have an 'Active', 'Phase out' or 'End of live' life cycle phase defined
				in the time frame between minus/plus one year of the current year to be included,
				except for the life cycle rule</p>
				<dl>
					{arr.map((e, i) => {
						return (
							<span key={i}>
								<dt>[{i + 1}]</dt>
								<dd>{e}</dd>
							</span>
						);
					})}
				</dl>
			</div>
		);
	}
}

export default Report;
