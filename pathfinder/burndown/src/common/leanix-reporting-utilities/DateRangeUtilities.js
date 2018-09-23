/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

function getLatest(ranges) {
	if (!ranges) {
		return;
	}
	let result = ranges[0];
	for (let i = 1; i < ranges.length; i++) {
		const range = ranges[i];
		if (result.getEnd() <= range.getEnd()) {
			result = range;
		}
	}
	return result;
}

function getEarliest(ranges) {
	if (!ranges) {
		return;
	}
	let result = ranges[0];
	for (let i = 1; i < ranges.length; i++) {
		const range = ranges[i];
		if (result.getStart() >= range.getStart()) {
			result = range;
		}
	}
	return result;
}

export default {
	getLatest: getLatest,
	getEarliest: getEarliest
};