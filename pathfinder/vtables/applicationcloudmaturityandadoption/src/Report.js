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
const LOADING_ERROR = 2;

const RULE_OPTIONS = Utilities.createOptionsObj([RuleSet.adoptingApps].concat(RuleSet.singleRules));

const CURRENT_DATE = new Date();
CURRENT_DATE.setHours(0, 0, 0, 0);
const CURRENT_MONTH = CURRENT_DATE.getMonth();
const CURRENT_YEAR = CURRENT_MONTH >= 3 ? CURRENT_DATE.getFullYear() : CURRENT_DATE.getFullYear() - 1; // 3 ... April
const CURRENT_DATE_TS = CURRENT_DATE.getTime();

// indexes of the marketRow columns
const IDX_CURRENT = 0;
const IDX_FY0 = 1;
const IDX_FY1 = 2;
const IDX_FY2 = 3;
const IDX_FY3 = 4;
const IDX_FY4 = 5;
const IDX_FY5 = 6;
// that's a template for the _handleData method
const MARKET_ROW_COLUMNS = [
	getCurrentDate(),
	getFinancialYear(CURRENT_YEAR),
	getFinancialYear(CURRENT_YEAR + 1),
	getFinancialYear(CURRENT_YEAR + 2),
	getFinancialYear(CURRENT_YEAR + 3),
	getFinancialYear(CURRENT_YEAR + 4),
	getFinancialYear(CURRENT_YEAR + 5)
];

function getCurrentDate() {
	// name property is used as a comparable identifier in RuleSet
	return {
		name: 'current',
		// timestamps for 'start' are inclusive, 'end' are exclusive
		start: CURRENT_DATE_TS, // current date at 00:00:00:000
		end: CURRENT_DATE_TS + 86400000 // next day at 00:00:00:000
	};
}

function getFinancialYear(year) {
	// timestamps for 'start' are inclusive, 'end' are exclusive
	const startDate = new Date(year, 3, 1, 0, 0, 0, 0); // April 1st
	const startDateTS = startDate.getTime();
	const endDate = new Date(year + 1, 3, 1, 0, 0, 0, 0); // April 1st of next year
	const endDateTS = endDate.getTime();
	// name property is used as a comparable identifier in RuleSet
	return {
		name: (startDate.getFullYear() - 2000) + '/' + (endDate.getFullYear() - 2000),
		start: startDateTS,
		end: endDateTS
	};
}

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
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
			const applicationTagId = index.getFirstTagID('Application Type', 'Application');
			const itTagId = index.getFirstTagID('CostCentre', 'IT');
			lx.executeGraphQL(this._createQuery(applicationTagId, itTagId)).then((data) => {
				index.put(data);
				this._handleData(index, applicationTagId, itTagId);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false
		};
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
							relUserGroupToApplication { edges { node { factSheet { id } } } }
							relToParent { edges { node { factSheet { id } } } }
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

	_handleData(index, applicationTagId, itTagId) {
		const tableData = [];
		let additionalNotesMarker = 0;
		const additionalNotes = RuleSet.singleRules.reduce((obj, rule) => {
			if (rule.additionalNote) {
				obj[rule.name] = {
					marker: additionalNotesMarker++,
					note: rule.additionalNote
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
			allApplications.forEach((appl) => {
				const lifecycles = Utilities.getLifecycles(appl);
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
				RuleSet.singleRules.forEach((rule) => {
					// create row entry, if necessary
					if (!marketRows[rule.name]) {
						marketRows[rule.name] = MARKET_ROW_COLUMNS.map((fyEntry) => {
							const copy = Utilities.copyObject(fyEntry);
							copy.apps = [];
							return copy;
						});
					}
					if (!rule.appliesTo(index, appl)) {
						return;
					}
					rule.compute(index, appl, productionPhase, marketRows[rule.name], ruleConfig);
				});
			});
			// add results to tableData (singleRules)
			RuleSet.singleRules.forEach((rule) => {
				tableData.push({
					id: market + '-' + rule.name,
					market: this._getOptionKeyFromValue(this.MARKET_OPTIONS, market),
					rule: this._getOptionKeyFromValue(RULE_OPTIONS, rule.name),
					overallRule: rule.overallRule,
					isPercentage: false,
					current: marketRows[rule.name][IDX_CURRENT].apps.length,
					currentApps: marketRows[rule.name][IDX_CURRENT].apps.map((appl) => {
						return appl.name;
					}),
					fy0: marketRows[rule.name][IDX_FY0].apps.length,
					fy0Apps: marketRows[rule.name][IDX_FY0].apps.map((appl) => {
						return appl.name;
					}),
					fy1: marketRows[rule.name][IDX_FY1].apps.length,
					fy1Apps: marketRows[rule.name][IDX_FY1].apps.map((appl) => {
						return appl.name;
					}),
					fy2: marketRows[rule.name][IDX_FY2].apps.length,
					fy2Apps: marketRows[rule.name][IDX_FY2].apps.map((appl) => {
						return appl.name;
					}),
					fy3: marketRows[rule.name][IDX_FY3].apps.length,
					fy3Apps: marketRows[rule.name][IDX_FY3].apps.map((appl) => {
						return appl.name;
					}),
					fy4: marketRows[rule.name][IDX_FY4].apps.length,
					fy4Apps: marketRows[rule.name][IDX_FY4].apps.map((appl) => {
						return appl.name;
					}),
					fy5: marketRows[rule.name][IDX_FY5].apps.length,
					fy5Apps: marketRows[rule.name][IDX_FY5].apps.map((appl) => {
						return appl.name;
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
				currentApps: [],
				fy0: ruleResult.fy0,
				fy0Apps: [],
				fy1: ruleResult.fy1,
				fy1Apps: [],
				fy2: ruleResult.fy2,
				fy2Apps: [],
				fy3: ruleResult.fy3,
				fy3Apps: [],
				fy4: ruleResult.fy4,
				fy4Apps: [],
				fy5: ruleResult.fy5,
				fy5Apps: [],
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
			<div className='small'>
				<p>In general, applications need to be <b>within 80% of TCO</b> to be included and for specific rules that have</p>
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
