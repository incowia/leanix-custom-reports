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

function getFrom(obj, path, defaultValue) {
	if (!obj) {
		return defaultValue;
	}
	const pathArray = path.split(/\./);
	let result = obj;
	for (let i = 0; i < pathArray.length; i++) {
		result = result[pathArray[i]];
		if (!result) {
			break;
		}
	}
	return result ? result : defaultValue;
}

// TODO TableUtilities
/*
function createOptionsObj(optionValues) {
	if (!optionValues || !Array.isArray(optionValues)) {
		return {};
	}
	return optionValues.reduce((r, e, i) => {
		r[i] = e.name ? e.name : e;
		return r;
	}, {});
}

// TODO TableUtilities
function createOptionsObjFrom(obj, path) {
	return createOptionsObj(getFrom(obj, path, []));
}*/

// TODO ???
function getKeyToValue(obj, value) {
	if (!obj) {
		return;
	}
	for (let key in obj) {
		if (obj[key] === value) {
			return key;
		}
	}
}

// TODO VFUtilities
/*
function isProductionPhase(lifecycle) {
	if (!lifecycle || !lifecycle.phase) {
		return false;
	}
	switch (lifecycle.phase) {
		case 'phaseIn':
		case 'active':
		case 'phaseOut':
			return true;
		case 'plan':
		case 'endOfLife':
		default:
			return false;
	}
}

// TODO VFUtilities
const marketRE = /^([A-Z]+)_/;

// TODO VFUtilities
function getMarket(application) {
	if (!application) {
		return;
	}
	const m = marketRE.exec(application.name);
	if (!m) {
		return;
	}
	return m[1]; // first one is the match, followed by group matches
}*/

function getValues(obj) {
	if (!obj) {
		return [];
	}
	const result = [];
	for (let key in obj) {
		result.push(obj[key]);
	}
	return result;
}

function copyObject(obj, deep) {
	let result = {};
	if (!obj) {
		return result;
	}
	if (deep) {
		for (let key in obj) {
			const value = obj[key];
			if (Array.isArray(value)) {
				result[key] = copyArray(value, deep);
			} else if (typeof value === 'object') {
				result[key] = copyObject(value, deep);
			} else {
				result[key] = value;
			}
		}
	} else {
		for (let key in obj) {
			result[key] = obj[key];
		}
	}
	return result;
}

function copyArray(arr, deep) {
	if (!arr) {
		return [];
	}
	if (deep) {
		return arr.map((e) => {
			if (Array.isArray(e)) {
				return copyArray(e, deep);
			} else if (typeof e === 'object') {
				return copyObject(e, deep);
			} else {
				return e;
			}
		});
	} else {
		return arr.map((e) => {
			return e;
		});
	}
}

function areObjectsEqual(first, second, deep) {
	if (first === undefined || first === null || second === undefined || second === null) {
		return false;
	}
	if (first === second) {
		return true;
	}
	if (typeof first !== 'object' || typeof second !== 'object') {
		return false;
	}
	const firstKeys = Object.keys(first);
	for (let i = 0; i < firstKeys; i++) {
		const e1 = firstKeys[i];
		const v1 = first[e1];
		const v2 = second[e1];
		if (!v2) {
			return false;
		}
		if (deep) {
			if (Array.isArray(v1)) {
				if (!areArraysEqual(v1, v2, deep)) {
					return false;
				}
			} else if (typeof v1 === 'object') {
				if (!areObjectsEqual(v1, v2, deep)) {
					return false;
				}
			} else {
				if (v1 !== v2) {
					return false;
				}
			}
		} else {
			if (v1 !== v2) {
				return false;
			}
		}
	}
	return true;
}

function areArraysEqual(first, second, deep) {
	if (first === undefined || first === null || second === undefined || second === null) {
		return false;
	}
	if (first === second) {
		return true;
	}
	if (!Array.isArray(first) || !Array.isArray(second)) {
		return false;
	}
	if (first.length !== second.length) {
		return false;
	}
	for (let i = 0; i < first.length; i++) {
		const e1 = first[i];
		const e2 = second[i];
		if (deep) {
			if (Array.isArray(e1)) {
				if (!areArraysEqual(e1, e2, deep)) {
					return false;
				}
			} else if (typeof e1 === 'object') {
				if (!areObjectsEqual(e1, e2, deep)) {
					return false;
				}
			} else {
				if (e1 !== e2) {
					return false;
				}
			}
		} else {
			if (e1 !== e2) {
				return false;
			}
		}
	}
	return true;
}

function containsAny(first, second) {
	if (!first || !second) {
		return false;
	}
	for (let i = 0; i < second.length; i++) {
		if (first.includes(second[i])) {
			return true;
		}
	}
	return false;
}

function swap(array, first, second) {
	if (!array) {
		return;
	}
	const tmp = array[first];
	array[first] = array[second];
	array[second] = tmp;
}

// TODO ???
/*
function isArrayEmpty(arr, startIdx) {
	if (!arr) {
		return true;
	}
	if (!startIdx || startIdx < 0) {
		startIdx = 0;
	}
	for (let i = startIdx; i < arr.length; i++) {
		const e = arr[i];
		if (e !== undefined && e !== null) {
			if (Array.isArray(e) && isArrayEmpty(e, 0)) {
				continue;
			} else {
				return false;
			}
		}
	}
	return true;
}*/

export default {
	getFrom: getFrom,
	getKeyToValue: getKeyToValue,
	getValues: getValues,
	copyObject: copyObject,
	copyArray: copyArray,
	areObjectsEqual: areObjectsEqual,
	areArraysEqual: areArraysEqual,
	containsAny: containsAny,
	swap: swap
};
