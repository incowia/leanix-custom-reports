import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import RuleSet from './RuleSet';
import Table from './Table';

const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;

const RULE_OPTIONS = Utilities.createOptionsObj([RuleSet.adoptingApps].concat(RuleSet.singleRules));

const CURRENT_DATE = new Date();
	CURRENT_DATE.setHours(0, 0, 0, 0);
const CURRENT_MONTH = CURRENT_DATE.getMonth();
const CURRENT_YEAR = CURRENT_MONTH >= 3 ? CURRENT_DATE.getFullYear() : CURRENT_DATE.getFullYear() - 1; // 3 ... April
const CURRENT_DATE_TS = CURRENT_DATE.getTime();

// that's a template for the _handleData method
const MARKET_ROW_COLUMNS = [
	// the 'current' column must always be right before the current fiscal year!
	getCurrentDate(),
	getFinancialYear(CURRENT_YEAR, true),
	getFinancialYear(CURRENT_YEAR + 1, false),
	getFinancialYear(CURRENT_YEAR + 2, false),
	getFinancialYear(CURRENT_YEAR + 3, false),
	getFinancialYear(CURRENT_YEAR + 4, false),
	getFinancialYear(CURRENT_YEAR + 5, false)
];

function getCurrentDate() {
	return {
		// name property is used as a comparable identifier in RuleSet
		name: 'current',
		start: CURRENT_DATE_TS,
		end: CURRENT_DATE_TS + 86400000, // (usually) next day at 00:00:00:000
		isCurrentYear: true
	};
}

function getFinancialYear(year, isCurrentYear) {
	// get start point
	const startDate = new Date(year, 3, 1, 0, 0, 0, 0); // 1st apr
	const startDateTS = startDate.getTime();
	// get end point
	const endDate = new Date(year + 1, 2, 31, 0, 0, 0, 0); // 31th mar
	const endDateTS = endDate.getTime();
	return {
		// name property is used as a comparable identifier in RuleSet
		name: (startDate.getFullYear() % 100) + '/' + (endDate.getFullYear() % 100),
		start: startDateTS,
		end: endDateTS,
		isCurrentYear: isCurrentYear
	};
}

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._addLifecyclePhaseEnd = this._addLifecyclePhaseEnd.bind(this);
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
		lx.init().then(this._initReport);
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
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			const itTagId = index.getFirstTagID('CostCentre', 'IT');
			lx.executeGraphQL(this._createQuery(applicationTagId, itTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, itTagId);
			});
		});
	}

	_createConfig() {
		return {
			allowEditing: false
		};
	}

	_plainFactsheetRelation(relationName) {
		return `${relationName}{edges{node{factSheet{id}}}}`;
	}

	_createQuery(applicationTagId, itTagId) {
		const applicationTagIdFilter = applicationTagId ? `, { facetKey: "Application Type", keys: ["${applicationTagId}"] }` : '';
		const itTagIdFilter = itTagId ? `, { facetKey: "CostCentre", keys: ["${itTagId}"] }` : '';
		return `{applications: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: { facetFilters: [
						{ facetKey: "FactSheetTypes", keys: ["Application"] },
						{ facetKey: "withinTop80PercentOfTCO", keys: ["yes"] }
						${applicationTagIdFilter}
						${itTagIdFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							lifecycle { phases { phase startDate } }
							relApplicationToProject { edges { node { factSheet{ id } } } }
						}
					}}
				}
				projects: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: { facetFilters: [
						{ facetKey: "FactSheetTypes", keys: ["Project"] }
					]}
				) {
					edges { node { id name } }
				}
				userGroups: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: { facetFilters: [
						{ facetKey: "FactSheetTypes", keys: ["UserGroup"] }
					]}
				) {
					edges { node {
						id name
						...on UserGroup {
							${this._plainFactsheetRelation('relUserGroupToApplication')}
							${this._plainFactsheetRelation('relToParent')}
						}
					}}
				}}`;
	}

	_handleData(index, applicationTagId, itTagId) {
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
		// group applications by market, but ignore applications that meet the exclusion filter's condition
		const groupResult = this._groupByMarket(index.applications.nodes, (application) => {
			return (!applicationTagId && !index.includesTag(application, 'Application'))
				|| (!itTagId && !index.includesTag(application, 'IT'));
		});
		const groupedByMarket = groupResult.groups;
		this.MARKET_OPTIONS = groupResult.options;
		const ruleConfig = {};
		for (let market in groupedByMarket) {
			ruleConfig.market = market;
			const allApplications = groupedByMarket[market];
			// process rules
			const marketRows = {};
			// add a placeholder for 'adoptingApps' rule, since the rule
			// must be placed first, but computation is later
			const adoptingAppsIndex = tableData.length;
			tableData.push({});
			allApplications.forEach((e) => {
				const lifecycles = Utilities.getLifecycles(e);
				const activePhase = Utilities.getLifecyclePhase(lifecycles, ACTIVE);
				const phaseOutPhase = Utilities.getLifecyclePhase(lifecycles, PHASE_OUT);
				if (!activePhase && !phaseOutPhase) {
					return;
				}
				this._addLifecyclePhaseEnd(lifecycles, activePhase);
				this._addLifecyclePhaseEnd(lifecycles, phaseOutPhase);
				// create combined production phase and add date range props
				let productionPhase = undefined;
				if (activePhase) {
					productionPhase = Utilities.copyObject(activePhase);
					if (phaseOutPhase) {
						productionPhase.endDate = phaseOutPhase.endDate;
					}
				} else {
					productionPhase = Utilities.copyObject(phaseOutPhase);
				}
				productionPhase.start = productionPhase.startDate;
				productionPhase.end = productionPhase.endDate;
				// process single rules
				RuleSet.singleRules.forEach((e2) => {
					// create row entry, if necessary
					if (!marketRows[e2.name]) {
						marketRows[e2.name] = MARKET_ROW_COLUMNS.map((e3) => {
							const copy = Utilities.copyObject(e3);
							copy.apps = [];
							return copy;
						});
					}
					if (!e2.appliesTo(index, e)) {
						return;
					}
					e2.compute(index, e, productionPhase, marketRows[e2.name], ruleConfig);
				});
			});
			// add results to tableData (singleRules)
			RuleSet.singleRules.forEach((e) => {
				tableData.push({
					id: market + '-' + e.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, e.name),
					overallRule: e.overallRule,
					isPercentage: false,
					current: marketRows[e.name][0].apps.length,
					current_Apps: marketRows[e.name][0].apps.map((e) => {
						return e.name;
					}),
					fy0: marketRows[e.name][1].apps.length,
					fy0_Apps: marketRows[e.name][1].apps.map((e) => {
						return e.name;
					}),
					fy1: marketRows[e.name][2].apps.length,
					fy1_Apps: marketRows[e.name][2].apps.map((e) => {
						return e.name;
					}),
					fy2: marketRows[e.name][3].apps.length,
					fy2_Apps: marketRows[e.name][3].apps.map((e) => {
						return e.name;
					}),
					fy3: marketRows[e.name][4].apps.length,
					fy3_Apps: marketRows[e.name][4].apps.map((e) => {
						return e.name;
					}),
					fy4: marketRows[e.name][5].apps.length,
					fy4_Apps: marketRows[e.name][5].apps.map((e) => {
						return e.name;
					}),
					fy5: marketRows[e.name][6].apps.length,
					fy5_Apps: marketRows[e.name][6].apps.map((e) => {
						return e.name;
					}),
				});
			});
			// process adoptingApps rule
			const ruleResult = RuleSet.adoptingApps.compute(marketRows, ruleConfig);
			tableData[adoptingAppsIndex] = {
				id: market + '-' + RuleSet.adoptingApps.name,
				market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
				rule: this._getOptionKeyFromValue(RULE_OPTIONS, RuleSet.adoptingApps.name),
				isPercentage: true,
				current: ruleResult.current,
				current_Apps: [],
				fy0: ruleResult.fy0,
				fy0_Apps: [],
				fy1: ruleResult.fy1,
				fy1_Apps: [],
				fy2: ruleResult.fy2,
				fy2_Apps: [],
				fy3: ruleResult.fy3,
				fy3_Apps: [],
				fy4: ruleResult.fy4,
				fy4_Apps: [],
				fy5: ruleResult.fy5,
				fy5_Apps: [],
			};
		}
		lx.hideSpinner();
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			data: tableData,
			additionalNotes: additionalNotes
		});
	}

	// group nodes by market, but ignore nodes that meet the exclusion filter's condition
	_groupByMarket(nodes, exclusionFilter) {
		let marketCount = 0;
		const groupedByMarket = {};
		const marketOptions = {};
		nodes.forEach((e) => {
			if (exclusionFilter && exclusionFilter(e)) {
				return;
			}
			const market = Utilities.getMarket(e);
			if (!market) {
				return;
			}
			if (!groupedByMarket[market]) {
				groupedByMarket[market] = [];
				marketOptions[marketCount++] = market;
			}
			groupedByMarket[market].push(e);
		});
		return {
			groups: groupedByMarket,
			options: marketOptions
		};
	}

	_addLifecyclePhaseEnd(lifecycles, phase) {
		if (!lifecycles || !phase || !phase.phase || !phase.startDate) {
			return;
		}
		let nextPhaseKey = this._getNextPhaseKey(phase.phase);
		let nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		while (!nextPhase) {
			nextPhaseKey = this._getNextPhaseKey(nextPhaseKey);
			if (!nextPhaseKey) {
				break;
			}
			nextPhase = Utilities.getLifecyclePhase(lifecycles, nextPhaseKey);
		}
		if (nextPhase) {
			phase.endDate = nextPhase.startDate;
		}
	}

	_getNextPhaseKey(phase) {
		switch (phase) {
			case PLAN:
				return PHASE_IN;
			case PHASE_IN:
				return ACTIVE;
			case ACTIVE:
				return PHASE_OUT;
			case PHASE_OUT:
				return END_OF_LIFE;
			case END_OF_LIFE:
			default:
				return;
		}
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
			default:
				throw new Error('Unknown loading state: ' + this.state.loadingState);
		}
	}

	_renderProcessingStep(stepInfo) {
		return (
			<h4 className='text-center'>{stepInfo}</h4>
		);
	}

	_renderSuccessful() {
		return (
			<div>
				<Table data={this.state.data}
					currentFYear={CURRENT_YEAR}
					additionalNotes={this.state.additionalNotes}
					options={{
						market: this.MARKET_OPTIONS,
						rule: RULE_OPTIONS
					}}
					pageSize={RuleSet.ruleCount * 2}
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
			<div className='legend'>
				<p>Only applications are counted that are <b>within 80% of TCO</b> and that have</p>
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
