/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

import LifecycleUtilities from './LifecycleUtilities';

class DataIndex {

	constructor() {
		this.lifecycleModel = undefined;
	}

	putGraphQL(response) {
		if (!response) {
			return;
		}
		for (let key in response) {
			const value = response[key];
			this[key] = _buildIndex(value, false, this.lifecycleModel);
		}
	}

	putFacetData(key, response) {
		if (!key) {
			return;
		}
		this[key] = _buildIndex(response, false, this.lifecycleModel);
	}

	remove(key) {
		if (!key) {
			return;
		}
		const index = this[key];
		if (!index) {
			return;
		}
		delete this[key];
	}
}

function _buildIndex(data, factsheetIsNested, lifecycleModel) {
	const index = {
		nodes: [],
		byID: {}
	};
	if (Array.isArray(data.edges)) {
		data = data.edges;
	}
	data.forEach((e) => {
		if (e.node) {
			e = e.node;
		}
		let factsheet = e;
		if (factsheetIsNested && e.factSheet) {
			factsheet = e.factSheet;
			delete e.factSheet;
			e.factsheet = factsheet;
		}
		_buildSubIndices(factsheet, lifecycleModel);
		if (lifecycleModel) {
			const lifecycles = LifecycleUtilities.getLifecycles(factsheet, lifecycleModel);
			factsheet.lifecycle = lifecycles;
		}
		index.nodes.push(e);
		if (!e.id) {
			return;
		}
		index.byID[e.id] = e;
	});
	return index;
}

function _buildSubIndices(node, lifecycleModel) {
	for (let key in node) {
		const attr = node[key];
		if (!_isRelation(attr)) {
			continue;
		}
		node[key] = attr.edges.length === 0 ? undefined : _buildIndex(attr, true, lifecycleModel);
	}
}

function _isRelation(attr) {
	if (!attr || !Array.isArray(attr.edges)) {
		return false;
	}
	return true;
}

export default DataIndex;