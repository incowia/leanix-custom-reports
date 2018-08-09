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

const ALL_TAG_GROUPS_QUERY = `{tagGroups: allTagGroups(sort: {mode: BY_FIELD, key: "name", order: asc}) {
		edges { node {
				id name
				tags { edges { node { id name } } }
			}}
		}}`;

const EXTENDED_ALL_TAG_GROUPS_QUERY = `{tagGroups: allTagGroups(sort: {mode: BY_FIELD, key: "name", order: asc}) {
		edges { node {
				id name restrictToFactSheetTypes mode
				tags { edges { node { id name color } } }
			}}
		}}`;

// TODO
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

export default {
	ALL_TAG_GROUPS_QUERY: ALL_TAG_GROUPS_QUERY,
	EXTENDED_ALL_TAG_GROUPS_QUERY: EXTENDED_ALL_TAG_GROUPS_QUERY
};