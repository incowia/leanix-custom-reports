/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

function getRelatedFactsheets(index, node, key, relName, firstOnly) {
	if (!index || !node || !node.id || !key || !index[key] || !relName) {
		return firstOnly ? undefined : [];
	}
	return _getRelatedFactsheets(node, index[key], relName, firstOnly);
}

function getParent(node, key) {
	return getRelatedFactsheets(index, node, key, 'relToParent', true);
}

function getChildren(node, key) {
	return getRelatedFactsheets(index, node, key, 'relToChild', false);
}

function _getRelatedFactsheets(node, indexContainingFactsheets, relName, firstOnly) {
	const subIndex = node[relName];
	if (!subIndex) {
		return firstOnly ? undefined : [];
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

export default {
	getRelatedFactsheets: getRelatedFactsheets,
	getParent: getParent,
	getChildren: getChildren
};