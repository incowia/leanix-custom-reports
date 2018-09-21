/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

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