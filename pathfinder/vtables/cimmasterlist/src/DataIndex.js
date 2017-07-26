class DataIndex {

	constructor() {
		// contains only top level nodes
		this.byID = {};
	}

	put(data) {
		if (!data) {
			return;
		}
		for (let key in data) {
			const value = data[key];
			const index = {
				realData: data[key],
				nodes: [],
				byID: {}
			};
			this[key] = index;
			if (!Array.isArray(value.edges)) {
				continue;
			}
			value.edges.forEach(((e) => {
					if (!e.node) {
						return;
					}
					const node = e.node;
					index.nodes.push(node);
					resolveNestedInRelations(node);
					if (!node.id) {
						return;
					}
					index.byID[node.id] = node;
					this.byID[node.id] = node;
				}).bind(this));
		}
	}

	getParent(fromOrigin, from) {
		// v workspace note: only one parent possible
		if (!this[fromOrigin]) {
			return;
		}
		const node = this[fromOrigin].byID[from];
		if (!node) {
			return;
		}
		const parentRel = node.relToParent;
		if (!parentRel) {
			return;
		}
		const parentRelNodes = parentRel.nodes;
		if (!parentRelNodes || !Array.isArray(parentRelNodes)) {
			return;
		}
		for (let i = 0; i < parentRelNodes.length; i++) {
			const parentRelNodeID = parentRelNodes[i].id;
			if (!parentRelNodeID) {
				continue;
			}
			return this.byID[parentRelNodeID];
		}
	}

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

	getTags(tagGroupName, tagName, tagGroupNameAttribute, tagNameAttribute) {
		const that = this;
		const tagGroups = that.getNodesWithName(that.tagGroups, tagGroupName, tagGroupNameAttribute);
		if (!tagGroups) {
			return [];
		}
		const result = [];
		tagGroups.forEach((e) => {
			const tagsIndex = e.tags;
			if (!tagsIndex) {
				return;
			}
			const tags = that.getNodesWithName(tagsIndex, tagName, tagNameAttribute);
			if (!tags) {
				return;
			}
			tags.forEach((e2) => {
				result.push(e2);
			});
		});
		return result;
	}
}

function resolveNestedInRelations(node) {
	for (let key in node) {
		const value = node[key];
		if (!value || !Array.isArray(value.edges)) {
			continue;
		}
		if (value.edges.length === 0) {
			node[key] = null;
			continue;
		}
		const index = {
			readData: value,
			nodes: [],
			byID: {}
		};
		node[key] = index;
		value.edges.forEach((e) => {
			let node = e.node;
			if (node.factSheet) {
				node = node.factSheet;
			}
			index.nodes.push(node);
			resolveNestedInRelations(node);
			if (!node.id) {
				return;
			}
			index.byID[node.id] = node;
		});
	}
}

export default DataIndex;