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