import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import TableUtilities from './common/TableUtilities';
import ModalDialog from './common/ModalDialog';
import ViewUtils from './ViewsUtilities';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import SelectField from './SelectField';
import TemplateView from './TemplateView';
import NarrativeView from './NarrativeView';
import Roadmap from './Roadmap';
import ProjectRoadmapView from './ProjectRoadmapView';

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

const VALUE_BOX_ELEMENT_STYLE = {
	position: 'absolute',
	top: '0px',
	left: '0px',
	width: '100%',
	padding: '0.2em',
	zIndex: 100
};

const VALUE_BOX_GROUP_STYLE = {
	margin: '0px',
	padding: '0px',
	lineHeight: '1em'
};

const VALUE_BOX_STYLE = {
	display: 'inline-block',
	width: '100%',
	border: '1px solid black'
};

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
        measure: "CRM, Billing & Commercial Order Management",
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
		this._handleCloseModalDialog = this._handleCloseModalDialog.bind(this);
		this._handleValueBoxClick = this._handleValueBoxClick.bind(this);
		this._createDialogTableData = this._createDialogTableData.bind(this);
		this._renderAdditionalContentForCSMAdoption = this._renderAdditionalContentForCSMAdoption.bind(this);
		this._renderAdditionalContentForSimplificationObsolescence = this._renderAdditionalContentForSimplificationObsolescence.bind(this);
		this._renderAdditionalContentNotes = this._renderAdditionalContentNotes.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderViewList = this._renderViewList.bind(this);
		this._renderHeading = this._renderHeading.bind(this);
		this._renderViewArea = this._renderViewArea.bind(this);
		this._renderModalDialogContent = this._renderModalDialogContent.bind(this);
		this._renderValueBoxWithLink = this._renderValueBoxWithLink.bind(this);
		this._renderValueBox = this._renderValueBox.bind(this);
		this.state = {
			// TODO remove
			showRoadmapData: true,
			loadingState: LOADING_INIT,
			setup: null,
			showDialog: false,
			dialogValueBoxId: null,
			dialogPlatformId: null,
			dialogTableData: null,
			dialogWidth: '0px',
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
			const csmTagId = index.getFirstTagID('CSM', 'CSM');
			const transformTagId = index.getFirstTagID('Budget Type', 'Transform');
			lx.executeGraphQL(this._createQuery(platformTagId, csmTagId, transformTagId)).then((data) => {
				index.put(data);
				this._handleData(index, platformTagId, csmTagId, transformTagId);
			}).catch(this._handleError);
		}).catch(this._handleError);
	}

	_createConfig() {
		return {
			allowEditing: false,
			allowTableView: false,
			export: {
				autoScale: true,
				exportElementSelector: '#export',
				format: 'a1',
				inputType: 'HTML',
				orientation: 'landscape'
			},
		};
	}

	_createQuery(platformTagId, csmTagId, transformTagId) {
		// initial assume tagGroup.name changed or the id couldn't be determined otherwise
		const idFilter = {
			platform: '',
			csm: '',
			transform: ''
		};
		// initial assume to get it
		const tagNameDef = {
			platform: 'tags { name }',
			csm: 'tags { name }',
			transform: 'tags { name }'
		};
		if (platformTagId) {
			idFilter.platform = `, {facetKey: "BC Type", keys: ["${platformTagId}"]}`;
			tagNameDef.platform = '';
		}
		if (csmTagId) {
			idFilter.csm = `, {facetKey: "CSM", keys: ["${csmTagId}"]}`;
			tagNameDef.csm = '';
		}
		if (transformTagId) {
			idFilter.transform = `, {facetKey: "Budget Type", keys: ["${transformTagId}"]}`;
			tagNameDef.transform = '';
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
				departments: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]},
						{facetKey: "hierarchyLevel", operator: NOR, keys: ["1"]}
					]}
				) {
					edges { node {
						id
						... on UserGroup {
							relToParent { edges { node { factSheet { id } } } }
						}
					}}
				}
				platformsLvl1: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
						${idFilter.platform}
					]}
				) {
					edges { node {
						id name ${tagNameDef.platform}
						... on BusinessCapability {
							relToChild { edges { node { factSheet { id } } } }
						}
					}}
				}
				platformsLvl2: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${idFilter.platform}
					]}
				) {
					edges { node {
						id name ${tagNameDef.platform}
						... on BusinessCapability {
							relPlatformToApplication { edges { node { factSheet { id } } } }
						}
					}}
				}
				applications: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Application"]},
						{facetKey: "relApplicationToOwningUserGroup", operator: NOR, keys: ["__missing__"]},
						{facetKey: "relApplicationToPlatform", operator: NOR, keys: ["__missing__"]}
					]}
				) {
					edges { node {
						id name tags { name }
						... on Application {
							lifecycle { phases { phase startDate } }
							relApplicationToOwningUserGroup { edges { node { factSheet { id } } } }
							relApplicationToSegment { edges { node { description factSheet { id } } } }
							relProviderApplicationToInterface { edges { node { activeFrom factSheet { id } } } }
						}
					}}
				}
				csmInterfaces: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Interface"]}
						${idFilter.csm}
					]}
				) {
					edges { node {
						id name ${tagNameDef.csm}
					}}
				}
				projects: allFactSheets(
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["Project"]},
						{facetKey: "relProjectToUserGroup", operator: NOR, keys: ["__missing__"]},
						{facetKey: "relProjectToBusinessCapability", operator: NOR, keys: ["__missing__"]}
						${idFilter.transform}
					]}
				) {
					edges { node {
						id name ${tagNameDef.transform}
						... on Project {
							lifecycle { phases { phase startDate } }
							relProjectToUserGroup { edges { node { factSheet { id } } } }
							relProjectToBusinessCapability { edges { node { factSheet { id } } } }
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

	_handleData(index, platformTagId, csmTagId, transformTagId) {
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
		const applicationData = this._getApplicationData(index);
		const csmInterfaceData = this._getFilteredFactsheets(index, index.csmInterfaces.nodes, csmTagId, 'CSM', true);
		const marketData = this._getFilteredFactsheets(index, markets, undefined, undefined, true);
		for (let key in marketData) {
			const market = marketData[key];
			market.views = ViewUtils.getMarketViews(index, market);
		}
		const departmentData = this._getFilteredFactsheets(index, index.departments.nodes, undefined, undefined, true);
		for (let key in departmentData) {
			const department = departmentData[key];
			department.market = this._getMarketIDForDepartment(marketData, departmentData, department);
		}
		const segmentData = this._getFilteredFactsheets(index, segments, undefined, undefined, true);
		const platformsLvl1 = this._getFilteredFactsheets(index, index.platformsLvl1.nodes, platformTagId, 'Platform', false);
		const platformsLvl2 = this._getFilteredFactsheets(index, index.platformsLvl2.nodes, platformTagId, 'Platform', true);
		const boxValueData = {
			applications: applicationData,
			csmInterfaces: csmInterfaceData,
			markets: marketData,
			segments: segmentData,
			departments: departmentData
		};
		const viewData = ViewUtils.parseDescriptions(markets, platformsLvl2);
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
					sideAreaData = this._createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, boxValueData, viewData.blockColors);
					return;
				case BC_INTEGRATION_LAYERS:
					const integrationPlatform = subIndex.nodes.find((rel) => {
						const platformLvl2 = platformsLvl2[rel.id];
						return platformLvl2 && platformLvl2.name === BC_INTEGRATION;
					});
					if (integrationPlatform) {
						mainIntermediateAreaData = this._createAreaDataEntry(index, platformsLvl2[integrationPlatform.id], boxValueData, viewData.blockColors, true);
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
			mainAreaData[mainAreaPos] = this._createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, boxValueData, viewData.blockColors);
		});
		// build project roadmap data
		// TODO
		// TODO old as second, new as first view
		const projectData = this._getProjectData(index);
		console.log(projectData);
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

	_createTemplateViewEntry(index, platformLvl1, subIndex, platformsLvl2, boxValueData, blockColors) {
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
			result.items.push(this._createAreaDataEntry(index, platformLvl2, boxValueData, blockColors, false));
		});
		// sort by name
		result.items.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		return result;
	}

	_createAreaDataEntry(index, platform, boxValueData, blockColors, isIntegration) {
		const result = {
			id: platform.id,
			name: platform.name,
			boxValues: ViewUtils.getBoxValues(index, platform, boxValueData)
		};
		// compute remaining blockColors
		ViewUtils.addSimObsBlockColors(blockColors, result, isIntegration);
		return result;
	}

	_getApplicationData(index) {
		const result = {
			all: {},
			active: {},
			planned: {}
		};
		index.applications.nodes.forEach((application) => {
			if (!Utilities.hasLifecycle(application)) {
				return;
			}
			application.lifecycles = Utilities.getLifecycles(application);
			application.currentLifecycle = Utilities.getCurrentLifecycle(application, ViewUtils.CURRENT_DATE_TIME);
			result.all[application.id] = application;
			switch (application.currentLifecycle.phase) {
				case ViewUtils.LIFECYLCE_PHASE_PLAN:
				case ViewUtils.LIFECYLCE_PHASE_PHASE_IN:
					result.planned[application.id] = application;
					break;
				case ViewUtils.LIFECYLCE_PHASE_ACTIVE:
				case ViewUtils.LIFECYLCE_PHASE_PHASE_OUT:
					result.active[application.id] = application;
					break;
				case ViewUtils.LIFECYLCE_PHASE_END_OF_LIFE:
				default:
					break;
			}
		});
		return result;
	}

	_getProjectData(index) {
		const result = [];
		index.projects.nodes.forEach((project) => {
			if (!Utilities.hasLifecycle(project)) {
				return;
			}
			project.lifecycles = Utilities.getLifecycles(project);
			project.currentLifecycle = Utilities.getCurrentLifecycle(project, ViewUtils.CURRENT_DATE_TIME);
			result.push(project);
		});
		return result;
	}

	_getMarketIDForDepartment(marketData, departmentData, department) {
		const subIndex = department.relToParent;
		if (!subIndex) {
			return;
		}
		const parentId = subIndex.nodes[0].id;
		const market = marketData[parentId];
		if (!market) {
			// it's another department, try next parent
			return this._getMarketIDForDepartment(marketData, departmentData, departmentData[parentId]);
		}
		return market.id;
	}

	_getFilteredFactsheets(index, nodes, tagIds, tagNames, asIDMap) {
		if (asIDMap) {
			return this._createIDMap(index, nodes, tagIds, tagNames);
		} else {
			if (!tagIds) {
				return nodes.filter((e) => {
					return this._includesTags(index, e, tagIds, tagNames);
				});
			}
			return nodes;
		}
	}

	_includesTags(index, node, tagIds, tagNames) {
		if (Array.isArray(tagIds)) {
			return tagIds.every((tagId, i) => {
				return tagId || index.includesTag(node, tagNames[i]);
			});
		} else {
			return tagIds || index.includesTag(node, tagNames);
		}
	}

	_createIDMap(index, nodes, tagIds, tagNames) {
		const result = {};
		if (tagIds) {
			nodes.forEach((e) => {
				if (!this._includesTags(index, e, tagIds, tagNames)) {
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

	_handleCloseModalDialog() {
		this.setState({
			showDialog: false,
			dialogValueBoxId: null,
			dialogPlatformId: null,
			dialogTableData: null,
			dialogWidth: '0px'
		});
	}

	_handleValueBoxClick(platformId, valueBoxId) {
		return (evt) => {
			evt.preventDefault();
			const viewName = this.state.showView.name;
			this.setState({
				showDialog: true,
				dialogValueBoxId: valueBoxId,
				dialogPlatformId: platformId,
				dialogTableData: this._createDialogTableData(platformId, valueBoxId),
				dialogWidth: ViewUtils.isCSMAdoptionView(viewName) ? '1000px' : '400px'
			});
		};
	}

	_createDialogTableData(platformId, valueBoxId) {
		const result = [];
		const platform = this._getPlatformFromAreaData(platformId);
		let viewType = null;
		let valueType = null;
		let createEntryMethod = null;
		switch (valueBoxId) {
			case ViewUtils.LEGEND_CSM_ADOPTION_ADDITIONAL.current.text:
				viewType = 'csmado';
				valueType = 'current';
				createEntryMethod = '_createDialogTableDataEntryForCsmAdo';
				break;
			case ViewUtils.LEGEND_CSM_ADOPTION_ADDITIONAL.planned.text:
				viewType = 'csmado';
				valueType = 'planned';
				createEntryMethod = '_createDialogTableDataEntryForCsmAdo';
				break;
			case ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL.current.text:
				viewType = 'simobs';
				valueType = 'current';
				createEntryMethod = '_createDialogTableDataEntryForSimObs';
				break;
			case ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL.currentObsolete.text:
				viewType = 'simobs';
				valueType = 'currentObsolete';
				createEntryMethod = '_createDialogTableDataEntryForSimObs';
				break;
			case ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL.target.text:
				viewType = 'simobs';
				valueType = 'target';
				createEntryMethod = '_createDialogTableDataEntryForSimObs';
				break;
			case ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL.targetObsolete.text:
				viewType = 'simobs';
				valueType = 'targetObsolete';
				createEntryMethod = '_createDialogTableDataEntryForSimObs';
				break;
			default:
				break;
		}
		if (!viewType || !valueType || !createEntryMethod) {
			return result;
		}
		const stack = ViewUtils.getStackFromView(this.state.showView.name);
		const values = platform.boxValues[this.state.selectedMarket][stack][viewType][valueType];
		if (Array.isArray(values)) {
			values.forEach((e) => {
				result.push(this[createEntryMethod](e));
			});
		} else {
			for (let key in values) {
				result.push(this[createEntryMethod](values, key));
			}
		}
		// sort by name
		result.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		return result;
	}

	_createDialogTableDataEntryForCsmAdo(values, csmApiName) {
		const interfaces = [];
		for (let interfaceId in values[csmApiName].interfaces) {
			interfaces.push(values[csmApiName].interfaces[interfaceId]);
		}
		const applications = [];
		for (let applicationId in values[csmApiName].applications) {
			applications.push(values[csmApiName].applications[applicationId]);
		}
		// sort by name
		interfaces.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		applications.sort((a, b) => {
			return a.name.localeCompare(b.name);
		});
		return {
			name: csmApiName,
			applicationNames: applications.map((e) => {
				return e.name;
			}),
			applicationIds: applications.map((e) => {
				return e.id;
			}),
			interfaceNames: interfaces.map((e) => {
				return e.name;
			}),
			interfaceIds: interfaces.map((e) => {
				return e.id;
			})
		};
	}

	_createDialogTableDataEntryForSimObs(value) {
		return {
			id: value.id,
			name: value.name
		};
	}

	_getPlatformFromAreaData(platformId) {
		// could be in sideArea or mainArea or mainIntermediateArea
		const mainIntermediateArea = this.state.templateViewMainIntermediateAreaData;
		if (mainIntermediateArea.id === platformId) {
			return mainIntermediateArea;
		}
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

	_createModalDialogTitle() {
		const viewName = this.state.showView.name;
		const platform = this._getPlatformFromAreaData(this.state.dialogPlatformId);
		if (!platform) {
			// id is given, if the dialog should be shown
			return 'Hidden';
		}
		if (ViewUtils.isCSMAdoptionView(viewName) || ViewUtils.isSimplificationObsolescenceView(viewName)) {
			return this.state.dialogValueBoxId + ' for ' + platform.name;
		}
		return 'Unknown title';
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
			<div>
				<ModalDialog
					show={this.state.showDialog}
					width={this.state.dialogWidth}
					title={this._createModalDialogTitle()}
					content={this._renderModalDialogContent}
					onClose={this._handleCloseModalDialog} />
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
							{this._renderAdditionalContentNotes()}
							<div id='export'>
								{this._renderViewArea(market)}
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	_renderModalDialogContent() {
		const viewName = this.state.showView.name;
		if (ViewUtils.isCSMAdoptionView(viewName)) {
			return (
				<BootstrapTable data={this.state.dialogTableData} keyField='name'
					 striped hover search exportCSV height='300px'
					 options={{ clearSearch: true }}>
					<TableHeaderColumn dataSort
						 dataField='name'
						 width='300px'
						 dataAlign='left'
						 dataFormat={TableUtilities.formatOptionalText}
						 csvHeader='csm-api-name'
						 filter={TableUtilities.textFilter}
						>CSM API</TableHeaderColumn>
					<TableHeaderColumn
						 dataField='applicationNames'
						 width='300px'
						 dataAlign='left'
						 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.state.setup)}
						 formatExtraData={{ type: 'Application', id: 'applicationIds' }}
						 csvHeader='provider-applications'
						 csvFormat={TableUtilities.formatArray}
						 csvFormatExtraData=';'
						 filter={TableUtilities.textFilter}
						>Provider applications</TableHeaderColumn>
					<TableHeaderColumn
						 dataField='interfaceNames'
						 width='300px'
						 dataAlign='left'
						 dataFormat={TableUtilities.formatLinkArrayFactsheets(this.state.setup)}
						 formatExtraData={{ type: 'Interface', id: 'interfaceIds' }}
						 csvHeader='connected-interfaces'
						 csvFormat={TableUtilities.formatArray}
						 csvFormatExtraData=';'
						 filter={TableUtilities.textFilter}
						>Connected interfaces</TableHeaderColumn>
				</BootstrapTable>
			);
		}
		if (ViewUtils.isSimplificationObsolescenceView(viewName)) {
			return (
				<BootstrapTable data={this.state.dialogTableData} keyField='id'
					 striped hover search exportCSV height='300px'
					 options={{ clearSearch: true }}>
					<TableHeaderColumn
						 dataField='name'
						 width='300px'
						 dataAlign='left'
						 dataFormat={TableUtilities.formatLinkFactsheet(this.state.setup)}
						 formatExtraData={{ type: 'Application', id: 'id' }}
						 csvHeader='application'
						>Application</TableHeaderColumn>
				</BootstrapTable>
			);
		}
		return null;
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
		if (ViewUtils.isPlatformTransformationView(viewName)) {
			return this._renderTemplateView(market, 0, ViewUtils.getStackFromView(viewName));
		}
		if (ViewUtils.isCSMAdoptionView(viewName)) {
			return this._renderTemplateView(market, 1, ViewUtils.getStackFromView(viewName));
		}
		if (ViewUtils.isSimplificationObsolescenceView(viewName)) {
			return this._renderTemplateView(market, 2, ViewUtils.getStackFromView(viewName));
		}
		if (ViewUtils.isNarrativeView(viewName)) {
			return (<NarrativeView data={this.state.templateViewData.narratives[market.id].list} />);
		}
		if (ViewUtils.isProjectRoadmapView(viewName)) {
			// TODO remove toggle
			return (
				<div>
					<button onClick={() => {
						this.setState({ showRoadmapData: !this.state.showRoadmapData });
					}}>{this.state.showRoadmapData ? 'hide' : 'show'}</button>
					<ProjectRoadmapView showData={this.state.showRoadmapData} data={[]} />
				</div>
			);
		}
		// TODO remove
		if (ViewUtils.isProjectRoadmapView2(viewName)) {
			// TODO
			// - project roadmap
			// -> +3 years time frame
			// -> start ab current quartal
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
		switch (view) {
			case 0:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={ViewUtils.LEGEND_PLATFORM_TRANFORMATION}
					colorScheme={this.state.templateViewData.blockColors[market.id].platform[stack]}
					market={market.id}
					stack={stack} />);
			case 1:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={ViewUtils.LEGEND_CSM_ADOPTION}
					colorScheme={this.state.templateViewData.blockColors[market.id].csmado[stack]}
					market={market.id}
					stack={stack}
					additionalContent={this._renderAdditionalContentForCSMAdoption}
					additionalContentLegend={this._renderAdditionalContentLegend(ViewUtils.LEGEND_CSM_ADOPTION_ADDITIONAL)} />);
			case 2:
				return (<TemplateView
					sideArea={this.state.templateViewSideAreaData}
					mainArea={this.state.templateViewMainAreaData}
					mainIntermediateArea={this.state.templateViewMainIntermediateAreaData}
					legend={ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE}
					colorScheme={this.state.templateViewData.blockColors[market.id].simobs[stack]}
					market={market.id}
					stack={stack}
					additionalContent={this._renderAdditionalContentForSimplificationObsolescence}
					additionalContentLegend={this._renderAdditionalContentLegend(ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL)} />);
		}
	}

	_renderAdditionalContentForCSMAdoption(marketId, stack, platformId) {
		const platform = this._getPlatformFromAreaData(platformId);
		const values = platform.boxValues[marketId][stack].csmado;
		const current = values.current;
		const planned = values.planned;
		const target = this.state.templateViewData.csmAdoTargets[marketId][stack][platformId];
		const currentCount = Object.keys(current).length;
		const plannedCount = Object.keys(planned).length;
		const targetCount = (target ? target : 0);
		if (!currentCount && !plannedCount && !targetCount) {
			return null;
		}
		const legend = ViewUtils.LEGEND_CSM_ADOPTION_ADDITIONAL;
		return (
			<div style={VALUE_BOX_ELEMENT_STYLE}>
				<table style={{ display: 'inline-block' }}>
					<tbody>
						<tr style={VALUE_BOX_GROUP_STYLE}>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.current.text, legend.current.cssClass, currentCount)}
							</td>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.planned.text, legend.planned.cssClass, plannedCount)}
							</td>
						</tr>
						<tr style={VALUE_BOX_GROUP_STYLE}>
							<td></td>
							<td>
								{this._renderValueBox(legend.target.cssClass, targetCount)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	_renderAdditionalContentForSimplificationObsolescence(marketId, stack, platformId) {
		const platform = this._getPlatformFromAreaData(platformId);
		const values = platform.boxValues[marketId][stack].simobs;
		const current = values.current.length;
		const currentObsolete = values.currentObsolete.length;
		const target = values.target.length;
		const targetObsolete = values.targetObsolete.length;
		if (!current && !currentObsolete && !target && !targetObsolete) {
			return null;
		}
		const legend = ViewUtils.LEGEND_SIMPLIFICATION_OBSOLESCENCE_ADDITIONAL;
		return (
			<div style={VALUE_BOX_ELEMENT_STYLE}>
				<table style={{ display: 'inline-block' }}>
					<tbody>
						<tr style={VALUE_BOX_GROUP_STYLE}>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.current.text, legend.current.cssClass, current)}
							</td>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.currentObsolete.text, legend.currentObsolete.cssClass, currentObsolete)}
							</td>
						</tr>
						<tr style={VALUE_BOX_GROUP_STYLE}>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.target.text, legend.target.cssClass, target)}
							</td>
							<td>
								{this._renderValueBoxWithLink(platformId, legend.targetObsolete.text, legend.targetObsolete.cssClass, targetObsolete)}
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		);
	}

	_renderValueBoxWithLink(platformId, valueBoxId, cssClass, value) {
		if (value < 1) {
			return this._renderValueBox(cssClass, value);
		}
		return (
			<a href='#' onClick={this._handleValueBoxClick(platformId, valueBoxId)}>
				{this._renderValueBox(cssClass, value)}
			</a>
		);
	}

	_renderValueBox(cssClass, value) {
		return (
			<span className={cssClass} style={VALUE_BOX_STYLE}>
				{value}
			</span>
		);
	}

	_renderAdditionalContentLegend(legend) {
		return () => {
			return (
				<div key='additionalLegend'>
					<h3>Values</h3>
					<ul className='list-unstyled'>
						{Object.keys(legend).map((k, i) => {
							return (
								<li key={i}>
									<span className={legend[k].cssClass} style={VALUE_BOX_STYLE}>
										{legend[k].text}
									</span>
								</li>
							);
						})}
					</ul>
				</div>
			);
		};
	}

	_renderAdditionalContentNotes() {
		const viewName = this.state.showView.name;
		if (ViewUtils.isCSMAdoptionView(viewName) || ViewUtils.isSimplificationObsolescenceView(viewName)) {
			return (
				<p className='small text-muted'>Click on one of the value boxes to see what's getting counted.</p>
			);
		}
		// TODO add help text for narrative & project roadmap view
		return null;
	}
}

export default Report;
