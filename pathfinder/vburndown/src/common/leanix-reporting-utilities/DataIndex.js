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

	constructor(extendDataTypes, lifecycleModel) {
		this._extendDataTypes = extendDataTypes;
		this._lifecycleModel = lifecycleModel;
	}

	putGraphQL(response) {
		if (!response) {
			return;
		}
		for (let key in response) {
			const value = response[key];
			this[key] = _buildIndex(value, false, this._extendDataTypes, this._lifecycleModel);
		}
	}

	putFacetData(key, response) {
		if (!key) {
			return;
		}
		this[key] = _buildIndex(response, false, this._extendDataTypes, this._lifecycleModel);
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

	getRelatedFactsheets(node, key, relName, firstOnly) {
		if (!node || !node.id || !key || !this[key] || !relName) {
			return firstOnly ? undefined : [];
		}
		return _getRelatedFactsheets(node, this[key], relName, firstOnly);
	}

	getParent(node, key) {
		return this.getRelatedFactsheets(node, key, 'relToParent', true);
	}

	getChildren(node, key) {
		return this.getRelatedFactsheets(node, key, 'relToChild', false);
	}

	// TODO rest to TagUtilities
	/*
	includesTag(node, tagName) {
		if (!node || !node.tags || !Array.isArray(node.tags)) {
			return false;
		}
		for (let i = 0; i < node.tags.length; i++) {
			const tagObj = node.tags[i];
			if (tagObj && tagObj.name === tagName) {
				return true;
			}
		}
		return false;
	}

	getTagsFromGroup(node, tagGroupName) {
		if (!node || !node.tags || !Array.isArray(node.tags)) {
			return [];
		}
		const tags = this.getTags(tagGroupName).map((e) => {
			return e.name;
		});
		return node.tags.filter((e) => {
			return tags.includes(e.name);
		});
	}

	getFirstTagFromGroup(node, tagGroupName) {
		const result = this.getTagsFromGroup(node, tagGroupName);
		return result.length > 0 ? result[0] : undefined;
	}

	getNodesWithName(index, name, nameAttribute) {
		if (!nameAttribute) {
			nameAttribute = 'name';
		}
		const result = [];
		if (!index) {
			return result;
		}
		const nodes = index.nodes;
		if (!nodes) {
			return result;
		}
		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node[nameAttribute] === name) {
				result.push(node);
			}
		}
		return result;
	}

	getTags(tagGroupName, tagName) {
		const that = this;
		const tagGroups = that.getNodesWithName(that.tagGroups, tagGroupName);
		if (!tagGroups) {
			return [];
		}
		const result = [];
		if (tagName) {
			tagGroups.forEach((e) => {
				const tagsIndex = e.tags;
				if (!tagsIndex) {
					return;
				}
				const tags = that.getNodesWithName(tagsIndex, tagName);
				if (!tags) {
					return;
				}
				tags.forEach((e2) => {
					result.push(e2);
				});
			});
		} else {
			tagGroups.forEach((e) => {
				const tagsIndex = e.tags;
				if (!tagsIndex) {
					return;
				}
				tagsIndex.nodes.forEach((e2) => {
					result.push(e2);
				});
			});
		}
		return result;
	}

	getFirstTagID(tagGroupName, tagName) {
		let tags = this.getTags(tagGroupName, tagName);
		return tags.length > 0 ? tags[0].id : undefined;
	}*/
}

function _getRelatedFactsheets(node, indexContainingFactsheets, relName, firstOnly) {
	const subIndex = node[relName];
	if (!subIndex) {
		return;
	}
	if (firstOnly) {
		const relObj = subIndex.nodes[0];
		if (!relObj) {
			return;
		}
		return indexContainingFactsheets.byID[relObj.factsheet.id];
	} else {
		const result = [];
		subIndex.nodes.forEach((e) => {
			result.push(indexContainingFactsheets.byID[e.factsheet.id]);
		});
		return result;
	}
}

function _buildIndex(data, factsheetIsNested, extendDataTypes, lifecycleModel) {
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
		_buildSubIndices(factsheet);
		if (extendDataTypes) {
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

function _buildSubIndices(node, extendDataTypes, lifecycleModel) {
	for (let key in node) {
		const attr = node[key];
		if (!_isRelation(attr)) {
			continue;
		}
		node[key] = _buildIndex(attr, true, extendDataTypes, lifecycleModel);
	}
}

function _isRelation(attr) {
	if (!attr || !Array.isArray(attr.edges) || attr.edges.length === 0) {
		return false;
	}
	return true;
}

export default DataIndex;