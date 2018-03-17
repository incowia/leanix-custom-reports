import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import PTVsDef from './PlatformTransformationViewsDefinition';
import SelectField from './SelectField';
import TemplateView from './TemplateView';
import NarrativeView from './NarrativeView';
import Roadmap from './Roadmap';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

// lvl 1 platform bc's for name matching
const BC_BUSINESS_MANAGEMENT = 'Business Management';
const BC_CUSTOMER_MANAGEMENT = 'Customer Management';
const BC_SERVICE_MANAGEMENT = 'Service Management';
const BC_RESOURCE_MANAGEMENT = 'Resource Management';
const BC_CHANNELS_LAYER = 'Channels Layer';
const BC_INTEGRATION_LAYERS = 'Integration Layers';

// lvl 2 platform bc's for name matching
const BC_INTEGRATION = 'Integration';

// lifecycle phases
const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';

const CATEGORIES_ROADMAP = { // category names and their colors defined here
	prj0: { barColor: "#dff0d8", textColor: '#000' },
	prj1: { barColor: "#d9edf7", textColor: '#000' }
};
const MOCKED_DATA_ROADMAP = [
	{
        measure: "Channels",
        data: [
            ['prj1', "2017-01-01", "2019-04-01", 'One Sales Foundation', 10]
		]
	},
	{
        data: [
            ['prj1', "2017-01-01", "2018-04-01", 'One Login']
		]
	},
	{
        data: [
            ['prj1', "2017-01-01", "2018-04-01", 'One Customer Document Mgmt', 1]
		]
	},
	{
        measure: "Enterprise Overlay",
        data: [
            ['prj1', "2016-01-01", "2020-04-01", 'Digital Enterprise']
		]
	},
	{
        measure: "Contact Centre Operations",
        data: []
	},
	{
        measure: "Retail Ops & Logistics",
        data: []
	},
	{
        measure: "CRM, Billing and COM",
        data: [
            ['prj0', "2017-01-01", "2018-07-01", 'Ramp-Up and RFP'],
            ['prj1', "2018-07-01", "2022-04-01", 'Solstice', 50]
		]
	},
];

const CATEGORIES_ROADMAP_DEV = { // category names and their colors defined here
	bgPrimary: { barColor: "#377ab7", textColor: '#fff' },
	bgSuccess: { barColor: "#dff0d8", textColor: '#000' },
	bgInfo: { barColor: "#d9edf7", textColor: '#000' },
	bgWarning: { barColor: "#fcf8e3", textColor: '#000' },
	bgDanger: { barColor: "#f2dede", textColor: '#000' }
};
const MOCKED_DATA_ROADMAP_DEV = [
	{
        measure: "Category 0 www sakjdfsd sdfjsdiof sdfjsdwww www ",
        data: [
			// Category, FromDate, ToDate, Label, Info, Load
            ['bgPrimary', "2015-01-31", "2015-05-15", 'Label 1', 17, {a: 'abc', b: 'def', c: 'asidjsad ijadad', d: 15, e : new Date()}],
            ['bgSuccess', "2015-06-30", "2015-08-15", 'Label 2', 999],
            ['bgPrimary', "2015-09-30", "2015-10-15", 'Label 3'],
            ['bgPrimary', "2015-12-31", "2016-01-12"],
            ['bgPrimary', "2016-01-17", "2016-02-22", 'L4', 26214,
				{a: 'sfsdf sdfjsd', b: 'sfsdpf sfjsd djfsd', c: 12345, d: 15.6464, e: 1000*60*60*24, g: null, h:'saksdofksd sdfjksdpof jfpsdf sdjfposdfjs sdsdfkosd sdjfdf fjfdof'}
			],
            ['bgSuccess', "2016-03-31", "2016-04-15"],
            ['bgSuccess', "2016-06-30", "2016-07-15"],
            ['bgInfo', "2016-09-15", "2016-10-25"],
            ['bgWarning', "2016-12-31", "2017-01-15"],
            ['bgDanger', "2017-03-31", "2017-04-15", 'dkdkod fkdsfk'],
            ['bgSuccess', "2017-06-30", "2017-07-15", 'sadksakd sdjmsdfj'],
            ['bgDanger', "2017-09-30", "2017-10-15"],
            ['bgInfo', "2017-12-31", "2018-01-15"],
            ['bgDanger', "2018-03-31", "2018-04-15", 'asdsdjf sksdfko'],
            ['bgWarning', "2018-06-30", "2018-07-15"],
            ['bgSuccess', "2018-09-30", "2018-10-15"],
            ['bgInfo', "2018-10-16", "2019-05-15", 'djksajds sfjsdio sdfjsd']
        ]
    },
	{
        measure: 'ABS',
        data: [
            ['bgSuccess', "2015-12-01", "2016-02-15", 'Test', 55],
            ['bgInfo', "2016-02-28", "2016-04-15"],
            ['bgDanger', "2016-06-30", "2016-07-15", null, 222],
            ['bgSuccess', "2016-09-15", "2016-10-25"],
            ['bgDanger', "2016-12-01", "2017-03-17", 'xxx xx', 34],
            ['bgInfo', "2017-03-31", "2017-04-15", '', 1],
            ['bgDanger', "2017-06-30", "2017-07-15"],
            ['bgWarning', "2017-09-30", "2017-10-15"]
        ]
    },
	{
        measure: null,
        data: [
            ['bgSuccess', "2015-01-01", "2016-02-12", 'LABEL XXX', 15],
            ['bgInfo', "2016-02-13", "2016-05-15", 'abcdefg', 7],
            ['bgDanger', "2017-03-31", "2017-04-15", '', 34],
            ['bgDanger', "2017-06-30", "2017-07-15", '', 142],
            ['bgWarning', "2017-09-30", "2017-10-15", null, 76]
        ]
    },
	{
        data: [
            ['bgWarning', "2012-09-30", "2022-10-15", 'Under- and Overflow', 7777]
        ]
    },
	{
        measure: "Category 1",
        data: [
            ['bgWarning', "2015-01-01", "2015-06-01", 'Ansh dhdh jj', 177],
            ['bgPrimary', "2016-01-01", "2016-03-15", 'aksk akak'],
            ['bgDanger', "2017-01-01", "2017-10-10", 'jkddiuiwe dijdi', 1025],
            ['bgPrimary', "2018-01-01", "2018-02-20", 'AA']
        ]
    }
];

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
		this._getFilteredFactsheets = this._getFilteredFactsheets.bind(this);
		this._createIDMap = this._createIDMap.bind(this);
		this._handleSelectMarket = this._handleSelectMarket.bind(this);
		this._handleClickViewList = this._handleClickViewList.bind(this);
		this._renderAdditionalContentForCSMAdoption = this._renderAdditionalContentForCSMAdoption.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderViewList = this._renderViewList.bind(this);
		this._renderHeading = this._renderHeading.bind(this);
		this._renderViewArea = this._renderViewArea.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			setup: null,
			showView: null,
			selectMarketFieldData: null,
			selectedMarket: null,
			templateViewMarketData: null,
			templateViewData: null,
			templateViewSideAreaData: null,
			templateViewMainAreaData: null,
			templateViewMainIntermediateAreaData: null
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
			const platformTagId = index.getFirstTagID('BC Type', 'Platform');
			const itTagId = index.getFirstTagID('CostCentre', 'IT');
			const csmTagId = index.getFirstTagID('CSM', 'CSM');
			lx.executeGraphQL(this._createQuery(platformTagId, itTagId, csmTagId)).then((data) => {
				index.put(data);
				this._handleData(index, platformTagId, itTagId, csmTagId);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false,
			export: {
				autoScale: true,
				exportElementSelector: '#export',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			},
		};
	}

	_createQuery(platformTagId, itTagId, csmTagId) {
		let platformIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let platformTagNameDef = 'tags { name }'; // initial assume to get it
		if (platformTagId) {
			platformIdFilter = `, {facetKey: "BC Type", keys: ["${platformTagId}"]}`;
			platformTagNameDef = '';
		}
		let itIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		if (itTagId) {
			itIdFilter = `, {facetKey: "CostCentre", keys: ["${itTagId}"]}`;
		}
		let csmIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let csmTagNameDef = 'tags { name }'; // initial assume to get it
		if (itTagId) {
			csmIdFilter = `, {facetKey: "CSM", keys: ["${csmTagId}"]}`;
			csmTagNameDef = '';
		}
		return `{markets: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
					]}
				) {
					edges { node {
						id name tags { name }
						... on UserGroup {
							relToRequires { edges { node { description factSheet { id } } } }
						}
					}}
				}
				platformsLvl1: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
						${platformIdFilter}
					]}
				) {
					edges { node {
						id name ${platformTagNameDef}
						... on BusinessCapability {
							relToChild { edges { node { factSheet { id } } } }
						}
					}}
				}
				platformsLvl2: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${platformIdFilter}
					]}
				) {
					edges { node {
						id name ${platformTagNameDef}
						... on BusinessCapability {
							relPlatformToApplication { edges { node { factSheet { id } } } }
						}
					}}
				}
				applicationsPlanned: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]},
						{facetKey: "lifecycle", keys: ["plan", "phaseIn"], dateFilter: {
							from: "${PTVsDef.CURRENT_DATE_STRING}", to: "${PTVsDef.CURRENT_DATE_STRING}", type: TODAY
						}}
						${itIdFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							relApplicationToOwningUserGroup { edges { node { factSheet { id } } } }
							relApplicationToSegment { edges { node { description factSheet { id } } } }
							relProviderApplicationToInterface { edges { node { activeFrom factSheet { id } } } }
						}
					}}
				}
				applicationsActive: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]},
						{facetKey: "lifecycle", keys: ["active", "phaseOut"], dateFilter: {
							from: "${PTVsDef.CURRENT_DATE_STRING}", to: "${PTVsDef.CURRENT_DATE_STRING}", type: TODAY
						}}
						${itIdFilter}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							relApplicationToOwningUserGroup { edges { node { factSheet { id } } } }
							relApplicationToSegment { edges { node { description factSheet { id } } } }
							relProviderApplicationToInterface { edges { node { activeFrom factSheet { id } } } }
						}
					}}
				}
				csmInterfaces: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Interface"]}
						${csmIdFilter}
					]}
				) {
					edges { node {
						id name ${csmTagNameDef}
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

	_handleData(index, platformTagId, itTagId, csmTagId) {
		console.log(index);
		const segments = [];
		const markets = [];
		index.markets.nodes.forEach((e) => {
			if (index.includesTag(e, 'Segment')) {
				segments.push(e);
			} else {
				markets.push(e);
			}
		})
		const marketOptions = markets.map((e) => {
			return {
				value: e.id,
				label: e.name
			}
		});
		// build general data objects
		const marketData = this._getFilteredFactsheets(index, markets, undefined, undefined, true);
		for (let key in marketData) {
			const market = marketData[key];
			market.views = PTVsDef.getMarketViews(index, market);
		}
		const segmentData = this._getFilteredFactsheets(index, segments, undefined, undefined, true);
		const platformsLvl1 = this._getFilteredFactsheets(index, index.platformsLvl1.nodes, platformTagId, 'Platform', false);
		const platformsLvl2 = this._getFilteredFactsheets(index, index.platformsLvl2.nodes, platformTagId, 'Platform', true);
		const applications = {
			planned: this._getFilteredFactsheets(index, index.applicationsPlanned.nodes, itTagId, 'IT', true),
			active: this._getFilteredFactsheets(index, index.applicationsActive.nodes, itTagId, 'IT', true)
		};
		const csmInterfaces = this._getFilteredFactsheets(index, index.csmInterfaces.nodes, csmTagId, 'CSM', true);
		const viewData = PTVsDef.parseDescriptions(markets, platformsLvl2);
		// build template view data
		let sideAreaData = {};
		const mainAreaData = [];
		let mainIntermediateAreaData = {};
		platformsLvl1.forEach((platformLvl1) => {
			// get children
			const subIndex = platformLvl1.relToChild;
			if (!subIndex) {
				return;
			}
			let mainAreaPos = 0;
			switch (platformLvl1.name) {
				case BC_BUSINESS_MANAGEMENT:
					sideAreaData = this._createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, applications, csmInterfaces, marketData, segmentData);
					return;
				case BC_INTEGRATION_LAYERS:
					mainIntermediateAreaData = subIndex.nodes.find((rel) => {
						const platformLvl2 = platformsLvl2[rel.id];
						return platformLvl2 && platformLvl2.name === BC_INTEGRATION;
					});
					if (mainIntermediateAreaData) {
						// get factsheet object
						mainIntermediateAreaData = platformsLvl2[mainIntermediateAreaData.id];
						// strip data
						mainIntermediateAreaData = {
							id: mainIntermediateAreaData.id,
							name: mainIntermediateAreaData.name
						};
					}
					return;
				case BC_CHANNELS_LAYER:
					mainAreaPos = 0;
					break;
				case BC_CUSTOMER_MANAGEMENT:
					mainAreaPos = 1;
					break;
				case BC_SERVICE_MANAGEMENT:
					mainAreaPos = 2;
					break;
				case BC_RESOURCE_MANAGEMENT:
					mainAreaPos = 3;
					break;
				default:
					// ignore all others
					return;
			}
			// add to templateViewMainAreaData
			mainAreaData[mainAreaPos] = this._createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, applications, csmInterfaces, marketData, segmentData);
		});
		console.log(viewData);
		lx.hideSpinner();
		const firstSelectedMarket = marketOptions[0].value; // id of the first market
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			selectMarketFieldData: marketOptions,
			selectedMarket: firstSelectedMarket,
			showView: {
				name: marketData[firstSelectedMarket].views[0],
				viewIndex: 0
			},
			templateViewMarketData: marketData,
			templateViewData: viewData,
			templateViewSideAreaData: sideAreaData,
			templateViewMainAreaData: mainAreaData,
			templateViewMainIntermediateAreaData: mainIntermediateAreaData
		});
	}

	_getFilteredFactsheets(index, nodes, tagId, tagName, asIDMap) {
		if (asIDMap) {
			return this._createIDMap(index, nodes, !tagId ? tagName : undefined);
		} else {
			if (!tagId) {
				return nodes.filter((e) => {
					return index.includesTag(e, tagName);
				});
			}
			return nodes;
		}
	}

	_createIDMap(index, nodes, tagName) {
		const result = {};
		if (tagName) {
			nodes.forEach((e) => {
				if (!index.includesTag(e, tagName)) {
					return;
				}
				result[e.id] = e;
			});
		} else {
			nodes.forEach((e) => {
				result[e.id] = e;
			});
		}
		return result;
	}

	_createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, applications, csmInterfaces, marketData, segmentData) {
		const result = {
			id: platformLvl1.id,
			name: platformLvl1.name,
			items: []
		};
		subIndex.nodes.forEach((rel) => {
			const platformLvl2 = platformsLvl2[rel.id];
			if (!platformLvl2) {
				return;
			}
			result.items.push({
				id: platformLvl2.id,
				name: platformLvl2.name,
				csmAdoValues: PTVsDef.getCSMAdoptionValues(index, platformLvl2, applications, csmInterfaces, marketData, segmentData),
				simObsValues: 'TODO'
			});
		});
		// sort by name
		result.items.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		return result;
	}

	_handleSelectMarket(option) {
		const marketID = option.value;
		if (this.state.selectedMarket === marketID) {
			return;
		}
		this.setState({
			selectedMarket: marketID,
			showView: {
				name: this.state.templateViewMarketData[marketID].views[0],
				viewIndex: 0
			}
		});
	}

	_handleClickViewList(evt) {
		const showView = parseInt(evt.target.name, 10);
		if (this.state.showView.viewIndex === showView) {
			return;
		}
		this.setState({
			showView: {
				name: this.state.templateViewMarketData[this.state.selectedMarket].views[showView],
				viewIndex: showView
			}
		});
	}

	_getPlatformFromAreaData(platformId) {
		// could be in sideArea or mainArea
		const sideArea = this.state.templateViewSideAreaData;
		let entry = sideArea.items.find((entry) => {
			return entry.id === platformId;
		});
		if (entry) {
			return entry;
		}
		const mainArea = this.state.templateViewMainAreaData;
		for (let i = 0; i < mainArea.length; i++) {
			entry = mainArea[i].items.find((entry) => {
				return entry.id === platformId;
			});
			if (entry) {
				break;
			}
		}
		return entry;
	}

	render() {
		switch (this.state.loadingState) {
			case LOADING_INIT:
				return this._renderProcessingStep('Loading data...');
			case LOADING_SUCCESSFUL:
				if (this.state.selectMarketFieldData.length === 0) {
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
		const market = this.state.templateViewMarketData[this.state.selectedMarket];
		return (
			<div className='container-fluid'>
				<div className='row'>
					<div className='col-lg-2' style={{ height: '4em' }}>
						<SelectField useSmallerFontSize
							id='market'
							label='Market'
							options={this.state.selectMarketFieldData}
							value={market.id}
							onChange={this._handleSelectMarket} />
					</div>
					<div className='col-lg-10 text-muted' style={{
						height: '4em',
						lineHeight: '4em',
						verticalAlign: 'bottom'
					}}>
						Choose a market for which one you want to see more details.
					</div>
				</div>
				<div className='row'>
					<div className='col-lg-2'>
						{this._renderViewList(market)}
					</div>
					<div className='col-lg-10'>
						{this._renderHeading(market)}
						<div id='export'>
							{this._renderViewArea(market)}
						</div>
					</div>
				</div>
			</div>
		);
	}

	_renderViewList(market) {
		return (
			<div className='panel panel-default'>
				<div className='panel-heading'>Views</div>
				<div className='panel-body bg-info text-muted'>
					Choose a view down below by clicking on it. The chosen one can be exported directly
					(see <a className='btn btn-default btn-xs disabled' href='#' role='button'>...</a> button in the upper right corner).
				</div>
				<div className='list-group'>
					{market.views.map((stack, i) => {
						return (
							<button key={i} type='button'
								name={i}
								className='list-group-item small'
								onClick={this._handleClickViewList}>
								{stack}
							</button>
						);
					})}
				</div>
			</div>
		);
	}

	_renderHeading(market) {
		return (
			<h2>
				{market.views[this.state.showView.viewIndex] + ' for Market ' + market.name}
			</h2>
		);
	}

	_renderViewArea(market) {
		const viewName = this.state.showView.name;
		if (PTVsDef.isPlatformTransformationView(viewName)) {
			return this._renderTemplateView(market, 0, PTVsDef.getStackFromView(viewName));
		}
		if (PTVsDef.isCSMAdoptionView(viewName)) {
			return this._renderTemplateView(market, 1, PTVsDef.getStackFromView(viewName));
		}
		if (PTVsDef.isSimplificationObsolescenceView(viewName)) {
			return this._renderTemplateView(market, 2, PTVsDef.getStackFromView(viewName));
		}
		if (PTVsDef.isNarrativeView(viewName)) {
			return (<NarrativeView data={this.state.templateViewData.narratives[market.id].list} />);
		}
		if (PTVsDef.isProjectRoadmapView(viewName)) {
			const chartConfig = {
				timeSpan: ['2016-01-01', '2019-01-01'],
				gridlinesXaxis: true,
				gridlinesYaxis: true,
				infoLabel: 'CSM',
				bar: { height: 24, border: false },
				labelYwidth: 260
			};
			return (<Roadmap
				data={MOCKED_DATA_ROADMAP}
				categories={CATEGORIES_ROADMAP}
				config={chartConfig} />);
		}
		throw new Error('Unknown showView state: ' + this.state.showView);
	}

	_renderTemplateView(market, view, stack) {
		// TODO additionalContent
		switch (view) {
			case 0:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={PTVsDef.LEGEND_PLATFORM_TRANFORMATION}
					colorScheme={this.state.templateViewData.blockColors[market.id].platform[stack]} />);
			case 1:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={PTVsDef.LEGEND_CSM_ADOPTION}
					colorScheme={this.state.templateViewData.blockColors[market.id].csmado[stack]}
					additionalContent={this._renderAdditionalContentForCSMAdoption} />);
			case 2:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={PTVsDef.LEGEND_SIMPLIFICATION_OBSOLESCENCE}
					colorScheme={this.state.templateViewData.blockColors[market.id].platform[stack]}
					additionalContent={undefined} />);
		}
	}

	_renderAdditionalContentForCSMAdoption(platformId) {
		const platform = this._getPlatformFromAreaData(platformId);
		if (!platform) {
			// id could also be integration, which must be excluded
			return null;
		}
		const market = this.state.templateViewMarketData[this.state.selectedMarket];
		const stack = PTVsDef.getStackFromView(this.state.showView.name);
		const values = platform.csmAdoValues[market.id][stack];
		const target = this.state.templateViewData.csmAdoTargets[market.id][stack][platformId];
		console.log(platform.name + ' -> '
			+ 'current: ' + Object.keys(values.current).length
			+ ', planned: ' + Object.keys(values.planned).length
			+ ', target: ' + (target ? target : 0));
		return null;
	}
}

export default Report;
