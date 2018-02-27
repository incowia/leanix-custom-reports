import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import SelectField from './SelectField';
import TemplateView from './TemplateView';
import Utilities from './common/Utilities';
import NarrativeView from './NarrativeView';
import Roadmap from './Roadmap';
import ColorParser from './ColorParser';

const LOADING_INIT = 0;
const LOADING_SUCCESSFUL = 1;
const LOADING_ERROR = 2;

const CATEGORIES_ROADMAP = { // category names and their colors defined here
	cat0: { barColor: "#377eb8", textColor: '#fff' },
	cat1: { barColor: "#ff7f00", textColor: '#000' },
	cat2: { barColor: "purple" },
	cat3: { barColor: "green" }
};
const MOCKED_DATA_ROADMAP = [
	{
        measure: "Category 0",
        data: [
			// Category, FromDate, ToDate, Label, Number, Info, Payload
            ['cat0', "2015-03-31", "2015-04-15", 'Label 1', 17, {a: 'abc', b: 'def', c: 'asidjsad ijadad', d: 15, e : new Date()}],
            ['cat1', "2015-06-30", "2015-07-15", 'Label 2', 77],
            ['cat3', "2015-09-30", "2015-10-15", 'Label 3'],
            ['cat1', "2015-12-31", "2016-01-15"],
            ['cat2', "2016-01-17", "2016-01-22"],
            ['cat0', "2016-03-31", "2016-04-15"],
            ['cat0', "2016-06-30", "2016-07-15"],
            ['cat1', "2016-09-15", "2016-10-25"],
            ['cat1', "2016-12-31", "2017-01-15"],
            ['cat2', "2017-03-31", "2017-04-15"],
            ['cat0', "2017-06-30", "2017-07-15"],
            ['cat2', "2017-09-30", "2017-10-15"],
            ['cat1', "2017-12-31", "2018-01-15"],
            ['cat2', "2018-03-31", "2018-04-15"],
            ['cat0', "2018-06-30", "2018-07-15"],
            ['cat0', "2018-09-30", "2018-10-15"],
            ['cat1', "2018-10-16", "2019-05-15"]
        ]
    },
	{
        measure: 'ABS',
        data: [
            ['cat0', "2015-12-01", "2016-02-15", null, 55],
            ['cat1', "2016-02-28", "2016-04-15"],
            ['cat2', "2016-06-30", "2016-07-15", null, 222],
            ['cat0', "2016-09-15", "2016-10-25"],
            ['cat2', "2016-12-01", "2017-03-17", '', 34],
            ['cat1', "2017-03-31", "2017-04-15", '', 1],
            ['cat2', "2017-06-30", "2017-07-15"],
            ['cat0', "2017-09-30", "2017-10-15"]
        ]
    },
	{
        measure: null,
        data: [
            ['cat0', "2015-01-01", "2016-02-12", 'LABEL XXX', 15],
            ['cat1', "2016-02-14", "2016-05-15", '', 7],
            ['cat1', "2017-03-31", "2017-04-15", '', 34],
            ['cat2', "2017-06-30", "2017-07-15", '', 142],
            ['cat0', "2017-09-30", "2017-10-15", null, 76]
        ]
    },
	{
        measure: "Category 1",
        data: [
            ['cat1', "2015-01-01", "2015-06-01", 'Ansh dhdh jj', 177],
            ['cat1', "2016-01-01", "2016-03-15", 'aksk akak'],
            ['cat2', "2017-01-01", "2017-10-10", 'jkddiuiwe dijdi', 1025],
            ['cat1', "2018-01-01", "2018-02-20", 'AA']
        ]
    }
];

const MOCKED_DATA_NARRATIVE = [
    {
        platform: '   ',
        plans: ['xxx', 'yyy', 'zzz']
    },
    {
        platform: "0 No List items",
        plans: ["", "   "]
    },
    {
        platform: "1 Democritum Conclusionemque",
        plans: [
            "1 Lorem ipsum dolor sit amet, at sit dicta zril. ... corrumpit te!",
            "",
            "2 Id eam debitis explicari? Eius voluptatibus at  ... per cibo urbanitas?",
            "3 Id duo nobis possim hendrerit? Iusto verterem cu vim, ridens ... quis ipsum cotidieque te pro?"
        ]
    },
    {
        platform: "2 Omnes volutpat ex mel",
        plans: [
            "Ea atqui fastidii scribentur vis, homero conclusionemque sea an. Cum ad  ... eum. Expetenda percipitur ex nam.",
            "Vix cu iudico pertinax persecuti, an ius simul accusamus. Id movet  ... populo concludaturque.",
            "Sit ad soleat doctus. No esse fabulas argumentum ius, vocent antiopam  ... veniam audiam eu."
        ]
    },
    {
        platform: "3 Usu mundi viderer ne",
        plans: [
            "Id duo erat sadipscing, vero iudicabit his no, sed ad  ... appetere recusabo vis?"
        ]
    },
    {
        platform: "4 Empty list: Per ea errem democritum conclusionemque",
        plans: []
    },
    {
        platform: "5 Tale consul numquam mei cu",
        plans: [
            "Tale consul numquam mei cu, in enim exerci graece vim, nam ad  ... diceret indoctum recteque.",
            "Ut nam voluptua electram? Ut vel vidisse verterem omittantur? Eum cibo  ... odio option vim.",
            "Per ea errem democritum conclusionemque, ex eos possim audire iuvaret. Discere officiis philosophia  ... mel augue posidonium."
        ]
    }
];

// mocks
const sideArea = {
	// Lvl 1 Platform BC (Factsheet object)
	id: '1',
	name: 'Business Management',
	// show max. 3 children in one row
	items: [
		// Lvl 2 Platform BC (child, Factsheet object)
		{
			id: '2',
			name: 'Business & Collaboration'
		}, {
			id: '3',
			name: 'Security'
		}, {
			id: '4',
			name: 'HR / Supply Chain / Finance'
		}, {
			id: '5',
			name: 'Analytics & Intelligence'
		}
	]
};
const mainArea = [
	// contains Lvl 1 Platform BCs with nested children (Lvl 2)
	// order Lvl 1: Channel layer, Customer Management, Service Management, Resource Management
	// order Lvl 2: as it is (from query)
	// if there are at least 2 children, then show Lvl 1, else just show that one child
	{
		// Lvl 1 Platform BC (Factsheet object)
		id: '6',
		name: 'Channel layer',
		items: [{
			// Lvl 2 Platform BC (child, Factsheet object)
			id: '7',
			name: 'Channels'
		}
		]
	}, {
		id: '8',
		name: 'Customer Management',
		items: [{
			id: '9',
			name: 'Contact Centre Operations'
		}, {
			id: '10',
			name: 'Retail Operations & Logistics'
		}, {
			id: '11',
			name: 'CRM, Billing and Commercial Order Management'
		}
		]
	}, {
		id: '12',
		name: 'Service Management',
		items: [{
			id: '13',
			name: 'Service Assurance'
		}, {
			id: '14',
			name: 'Charging & Policy Management'
		}, {
			id: '15',
			name: 'Service Orchestration'
		}
		]
	}, {
		id: '16',
		name: 'Resource Management',
		items: [{
			id: '17',
			name: 'Resource Fault & Performance'
		}, {
			id: '18',
			name: 'Resource Inventory'
		}, {
			id: '19',
			name: 'Resource Activation & Configuration'
		}
		]
	}
];
const integration = {
	// Factsheet object
	id: '20',
	name: 'Integration'
};
const viewOneLegend = [
	// also valid for view 2
	// can be made a static constant
	{
		color: 'green',

		text: 'Target Platform already in place'
	}, {
		color: 'yellow',
		text: 'Plan to Adopt platform from another market'
	}, {
		color: 'orange',
		text: 'Step-wise evolution to target'
	}, {
		color: 'red',
		text: 'Plan to build new target capability'
	}, {
		color: 'gray',
		text: 'Plan to wrap existing legacy'
	}, {
		color: 'white',
		text: 'Plan to remove capability'
	}, {
		color: 'blue',
		text: 'Plan is not clear'
	}, {
		color: 'pink',
		text: 'No information available'
	}
];
const viewOneColorScheme = {}; // will be specified later
const viewOneAdditionalContent = undefined; // not relevant for view 1

class Report extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._getFilteredBCs = this._getFilteredBCs.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
		this._handleClickViewArea = this._handleClickViewArea.bind(this);
		this._handleViewSelect = this._handleViewSelect.bind(this);
		this._renderSuccessful = this._renderSuccessful.bind(this);
		this._renderViewList = this._renderViewList.bind(this);
		this._renderHeading = this._renderHeading.bind(this);
		this._renderViewArea = this._renderViewArea.bind(this);
		this.state = {
			loadingState: LOADING_INIT,
			setup: null,
			data: [],
			showView: 0,
			selectedMarket: null

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
			this.index = index;
			index.put(tagGroups);
			const platformId = index.getFirstTagID('BC Type', 'Platform');
			lx.executeGraphQL(this._createQuery(platformId)).then((data) => {
				index.put(data);
				this._handleData(index, platformId);
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

	_createQuery(platformId) {
		let platformIdFilter = ''; // initial assume tagGroup.name changed or the id couldn't be determined otherwise
		let platformTagNameDef = 'tags { name }'; // initial assume to get it
		if (platformId) {
			platformIdFilter = `, {facetKey: "BC Type", keys: ["${platformId}"]}`;
			platformTagNameDef = '';
		}
		return `{userGroups: allFactSheets(
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
				businessCapabilitiesLvl1: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
						${platformIdFilter}
					]}
				) {
					edges { node { id name ${platformTagNameDef} } }
				}
				businessCapabilitiesLvl2: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["BusinessCapability"]},
						{facetKey: "hierarchyLevel", keys: ["2"]}
						${platformIdFilter}
					]}
				) {
					edges { node { id name ${platformTagNameDef} } }
				}}`;
	}

	_handleError(err) {
		console.error(err);
		this.setState({
			loadingState: LOADING_ERROR
		});
		lx.hideSpinner();
	}

	_handleData(index, platformId) {
		console.log(index);
		console.log(ColorParser.parse(index));
		const selectFieldData = this._getMarkets(index.userGroups.nodes);
		const bcsLvl1 = this._getFilteredBCs(index.businessCapabilitiesLvl1.nodes, platformId, 'Platform');
		const bcsLvl2 = this._getFilteredBCs(index.businessCapabilitiesLvl2.nodes, platformId, 'Platform');
		this.state.data.push(1);
		lx.hideSpinner();
		this.setState({
			loadingState: LOADING_SUCCESSFUL,
			selectFieldData: selectFieldData,
			// access 'userGroups'
			selectedMarket: index.byID[selectFieldData[0].value]
		});
	}

	_getFilteredBCs(nodes, tagId, tagName) {
		if (!tagId) {
			return nodes.filter((e) => {
				return this.index.includesTag(e, tagName);
			});
		}
		return nodes;
	}

	_getMarkets(nodes) {
		return nodes.map((e) => {
			return {
				value: e.id,
				label: e.name
			}
		});
	}

	_handleClickViewArea(evt) {
		const showView = parseInt(evt.target.name, 10);
		if (this.state.showView === showView) {
			return;
		}
		this.setState(
			{showView: showView}
		)
	};

	_handleViewSelect(option) {
		const marketID = option.value;
		if (this.state.selectedMarket.id === marketID) {
			return;
		}
		// access 'userGroups'
		const market = this.index.byID[marketID];
		this.setState({selectedMarket: market});
	};

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
			<div className='container-fluid'>
				<div className='row'>
					<div className='col-lg-2'>
						<SelectField useSmallerFontSize
						 id='market'
						 label='Market'
						 options={this.state.selectFieldData}
						 value={this.state.selectedMarket.id}
						 onChange={this._handleViewSelect}/>
					</div>
					<div className='col-lg-10'>
						<br/>
						<p>Choose a market for which one you want to see more details.</p>
					</div>
				</div>
				<div className='row'>
					<div className='col-lg-2'>
						{this._renderViewList()}
					</div>
					<div className='col-lg-10'>
						{this._renderHeading()}
						<div id='export'>
							{this._renderViewArea()}
						</div>
					</div>
				</div>
			</div>
		);
	}

	_renderViewList() {
		return (
			<div className='panel panel-default'>
				<div className='panel-heading'>Views</div>
				<div className='panel-body'>
					<p>Choose a view down below by clicking on it. The chosen one can be exorted directly.</p>
				</div>
				<div className='list-group'>
					<button type='button' name='0' className='list-group-item' onClick={this._handleClickViewArea}>Platform transformation</button>
					<button type='button' name='1' className='list-group-item' onClick={this._handleClickViewArea}>CSM adoption</button>
					<button type='button' name='2' className='list-group-item' onClick={this._handleClickViewArea}>Simplification & Obsolescence</button>
					<button type='button' name='3' className='list-group-item' onClick={this._handleClickViewArea}>Narrative</button>
					<button type='button' name='4' className='list-group-item' onClick={this._handleClickViewArea}>Project Roadmap</button>
				</div>
			</div>
		);
	}

	_renderHeading() {
		switch (this.state.showView) {
			case 0:
				return (<h3>Platform transformation view for Market {this.state.selectedMarket.name}</h3>);
			case 1:
				return (<h3>CSM adoption view for Market {this.state.selectedMarket.name}</h3>);
			case 2:
				return (<h3>Simplification & Obsolescence view for Market {this.state.selectedMarket.name}</h3>);
			case 3:
				return (<h3>Narrative view for Market {this.state.selectedMarket.name}</h3>);
			case 4:
				return (<h3>Project roadmap view for Market {this.state.selectedMarket.name}</h3>);
			default:
				throw new Error('Unknown showView state: ' + this.state.showView);
		}
	}

	_renderViewArea() {
		switch (this.state.showView) {
			case 0:
				return <TemplateView
					sideArea={sideArea}
					mainArea={mainArea}
					mainIntermediateArea={integration}
					legend={viewOneLegend}
					colorScheme={viewOneColorScheme}
					additionalContent={viewOneAdditionalContent} />;
			case 1:
				return <TemplateView/>;
			case 2:
				return <TemplateView/>;
			case 3:
				return <NarrativeView data={MOCKED_DATA_NARRATIVE}/>;
			case 4:
				const chartConfig = {
					timeSpan: ['2015-01-01', '2018-01-01'],
					gridlineX: true,
					gridlineY: false,
					infoLabel: 'CSM'
				};
				return (
					<Roadmap
						data={MOCKED_DATA_ROADMAP}
						categories={CATEGORIES_ROADMAP}
						config={chartConfig}
					/>);
			default:
				throw new Error('Unknown showView state: ' + this.state.showView);
		}
	}
}
export default Report;
