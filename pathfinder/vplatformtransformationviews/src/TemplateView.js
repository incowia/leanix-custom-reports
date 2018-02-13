import React, { Component } from 'react';
import CommonQueries from './common/CommonGraphQLQueries';
import DataIndex from './common/DataIndex';
import Utilities from './common/Utilities';
import SelectField from "./SelectField";

class TemplateView extends Component {

	constructor(props) {
		super(props);
		this._initReport = this._initReport.bind(this);
		this._handleData = this._handleData.bind(this);
		this._handleError = this._handleError.bind(this);
		this.state = {
			setup: null,
			data: [],
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
		return `{userGroups: allFactSheets(
					sort: { mode: BY_FIELD, key: "displayName", order: asc },
					filter: {facetFilters: [
						{facetKey: "FactSheetTypes", keys: ["UserGroup"]},
						{facetKey: "hierarchyLevel", keys: ["1"]}
					]}
				) {
					edges { node { id displayName } }
				}}`;
	}

	_handleError(err) {
		console.error(err);
		lx.hideSpinner();
	}

	_handleData(index) {
		this.state.data.push(1);
		lx.hideSpinner();
	}

	render() {
		return(
			<div className="panel panel-default">
				<div className="panel-body">
					Basic panel example
				</div>
			</div>);
	}
}

export default TemplateView;
