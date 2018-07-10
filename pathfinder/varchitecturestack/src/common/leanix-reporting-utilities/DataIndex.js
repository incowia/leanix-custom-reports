/* The MIT License (MIT)

Copyright (c) 2018 LeanIX GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

// from https://github.com/leanix/leanix-custom-reports

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
		node[key] = _buildIndex(attr, true, lifecycleModel);
	}
}

function _isRelation(attr) {
	if (!attr || !Array.isArray(attr.edges) || attr.edges.length === 0) {
		return false;
	}
	return true;
}

export default DataIndex;