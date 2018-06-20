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

const INIT_START = getCurrent(false);
const INIT_END = getCurrent(true);

// Number.MAX_SAFE_INTEGER (note: not supported in IE11)
const MAX_TIMESTAMP = 9007199254740991;

function getInit(asEndDate) {
	return asEndDate ? INIT_END : INIT_START;
}

function getCurrent(asEndDate) {
	const current = new Date();
	_normalize(current, asEndDate);
	return current.getTime();
}

function _normalize(date, asEndDate) {
	if (asEndDate) {
		date.setHours(23, 59, 59, 999);
	} else {
		date.setHours(0, 0, 0, 0);
	}
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

function _getDate(date) {
	if (date === undefined || date === null) {
		return;
	}
	if (typeof date === 'number' || date instanceof Number) {
		return new Date(date);
	}
	if (date instanceof Date) {
		return new Date(date.getTime());
	}
}

function plusYears(date, years) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	if (years < 1) {
		return date;
	}
	date.setFullYear(date.getFullYear() + years);
	return date.getTime();
}

function minusYears(date, years) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	if (years < 1) {
		return date;
	}
	date.setFullYear(date.getFullYear() - years);
	return date.getTime();
}

function getPreviousMonth(date) {
	// TODO
}

function getNextMonth(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	const oldDay = date.getDate();
	date.setDate(2);
	date.setMonth(date.getMonth() + 1);
	_setAdjustedDay(date, oldDay);
	_normalize(date, false);
	return date.getTime();
}

function _setAdjustedDay(date, oldDay) {
	const adjustedDay = _getAdjustedDay(date.getMonth(), oldDay);
	if (adjustedDay === -1) {
		// special handling for feb
		const tmp = new Date(date);
		tmp.setDate(29);
		if (tmp.getMonth() !== date.getMonth()) {
			date.setDate(28);
		} else {
			date.setDate(29);
		}
	}
	date.setDate(adjustedDay);
}

function _getAdjustedDay(month, day) {
	switch (month) {
		// all these month have 31 days, so return
		case 0: case 2: case 4: case 6: case 7: case 9: case 11:
			return day;
		// feb
		case 1:
			return day > 28 ? -1 : day;
		// all others with 30 days
		case 3: case 5: case 8: case 10:
			return day > 30 ? 30 : day;
		default:
			throw 'Unknown month: ' + month;
	}
}

function getPreviousQuarter(date) {
	// TODO
}

function getNextQuarter(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	const oldDay = date.getDate();
	const currentQuarterMonth = _getQuarterStartMonth(date.getMonth());
	date.setDate(2);
	date.setMonth(currentQuarterMonth + 3);
	_setAdjustedDay(date, oldDay);
	_normalize(date, false);
	return date.getTime();
}

function getQuarterString(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	switch (date.getMonth()) {
		case 0: case 1: case 2:
			return 'Q1';
		case 3: case 4: case 5:
			return 'Q2';
		case 6: case 7: case 8:
			return 'Q3';
		case 9: case 10: case 11:
			return 'Q4';
		default:
			throw 'Unknown month: ' + currentMonth;
	}
}

function getFirstDayOfMonth(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setDate(1);
	_normalize(date, false);
	return date.getTime();
}

function getLastDayOfMonth(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setMonth(date.getMonth() + 1);
	date.setDate(0);
	_normalize(date, true);
	return date.getTime();
}

function getFirstDayOfQuarter(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setMonth(_getQuarterStartMonth(date.getMonth()));
	date.setDate(1);
	_normalize(date, false);
	return date.getTime();
}

function _getQuarterStartMonth(currentMonth) {
	switch (currentMonth) {
		case 0: case 1: case 2:
			return 0;
		case 3: case 4: case 5:
			return 3;
		case 6: case 7: case 8:
			return 6;
		case 9: case 10: case 11:
			return 9;
		default:
			throw 'Unknown month: ' + currentMonth;
	}
}

function getLastDayOfQuarter(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setMonth(_getQuarterEndMonth(date.getMonth()) + 1);
	date.setDate(0);
	_normalize(date, true);
	return date.getTime();
}

function _getQuarterEndMonth(currentMonth) {
	switch (currentMonth) {
		case 0: case 1: case 2:
			return 2;
		case 3: case 4: case 5:
			return 5;
		case 6: case 7: case 8:
			return 8;
		case 9: case 10: case 11:
			return 11;
		default:
			throw 'Unknown month: ' + currentMonth;
	}
}

function getFirstDayOfYear(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setMonth(0);
	date.setDate(1);
	_normalize(date, false);
	return date.getTime();
}

function getLastDayOfYear(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	date.setMonth(11);
	date.setDate(31);
	_normalize(date, true);
	return date.getTime();
}

function toInputDateString(date) {
	date = _getDate(date);
	if (date === undefined || date === null) {
		return;
	}
	// YYYY-MM-DD
	return date.getFullYear() + '-'
		+ _ensureTwoDigitString(date.getMonth() + 1) + '-'
		+ _ensureTwoDigitString(date.getDate());
}

function _ensureTwoDigitString(num) {
	return num < 10 ? ('0' + num) : num;
}

function parseInputDateString(str) {
	// YYYY-MM-DD
	const values = str.split('-');
	return new Date(parseInt(values[0], 10), parseInt(values[1], 10) - 1, parseInt(values[2], 10)).getTime();
}

export default {
	MAX_TIMESTAMP: MAX_TIMESTAMP,
	getInit: getInit,
	getCurrent: getCurrent,
	getTimestamp: getTimestamp,
	plusYears: plusYears,
	minusYears: minusYears,
	getNextMonth: getNextMonth,
	getNextQuarter: getNextQuarter,
	getQuarterString: getQuarterString,
	getFirstDayOfMonth: getFirstDayOfMonth,
	getLastDayOfMonth: getLastDayOfMonth,
	getFirstDayOfQuarter: getFirstDayOfQuarter,
	getLastDayOfQuarter: getLastDayOfQuarter,
	getFirstDayOfYear: getFirstDayOfYear,
	getLastDayOfYear: getLastDayOfYear,
	toInputDateString: toInputDateString,
	parseInputDateString: parseInputDateString
};