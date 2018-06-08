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

const INIT_START = getCurrentDate(false);
const INIT_END = getCurrentDate(true);

function getInit(asEndDate) {
	return asEndDate ? INIT_END : INIT_START;
}

function getCurrent(asEndDate) {
	const current = new Date();
	if (asEndDate) {
		current.setHours(23, 59, 59, 999);
	} else {
		current.setHours(0, 0, 0, 0);
	}
	return current.getTime();
}

function getTimestamp(date) {
	if (date === undefined || date === null) {
		return;
	}
	if (typeof date === 'number' || date instanceof Number) {
		return date;
	}
	if (date instanceof Date) {
		return date.getTime();
	}
	const maybeTS = date.valueOf();
	if (typeof maybeTS === 'number' || maybeTS instanceof Number) {
		// assume its the timestamp, which is the case for moment js
		return maybeTS;
	}
}

export default {
	getInit: getInit,
	getCurrent: getCurrent,
	getTimestamp: getTimestamp
};