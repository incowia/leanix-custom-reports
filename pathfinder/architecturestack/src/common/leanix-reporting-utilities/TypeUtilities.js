/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

function toBoolean(value) {
	switch (typeof value) {
		case 'string':
			return value === 'true' ? true : false;
		case 'number':
			return value === 1 ? true : false;
		case 'boolean':
			return value;
		case 'object':
			if (value instanceof Boolean) {
				return value.valueOf();
			} else if (value instanceof Number) {
				return value.valueOf() === 1 ? true : false;
			} else if (value instanceof String) {
				return value.valueOf() === 'true' ? true : false;
			} else {
				return false;
			}
		default:
			return false;
	}
}

const IS_NUMBER_RE = new RegExp('^-?(?:0|[1-9]\\d*)(?:\\.\\d+)?(?:[eE][+-]?\\d+)?$');

function toNumber(value) {
	switch (typeof value) {
		case 'string':
			return IS_NUMBER_RE.test(value) ? parseFloat(value) : NaN;
		case 'number':
			return value;
		case 'boolean':
			return value ? 1 : 0;
		case 'object':
			if (value instanceof Boolean) {
				return value.valueOf() ? 1 : 0;
			} else if (value instanceof Number) {
				return value.valueOf();
			} else if (value instanceof String) {
				return IS_NUMBER_RE.test(value) ? parseFloat(value) : NaN;
			} else {
				return NaN;
			}
		default:
			return NaN;
	}
}

function toString(value) {
	switch (typeof value) {
		case 'string':
			return value;
		case 'number':
			return '' + value;
		case 'boolean':
			return '' + value;
		case 'object':
			if (value instanceof Boolean) {
				return value.toString();
			} else if (value instanceof Number) {
				return value.toString();
			} else if (value instanceof String) {
				return value.valueOf();
			} else {
				return '';
			}
		default:
			return '';
	}
}

function isBoolean(value) {
	switch (typeof value) {
		case 'boolean':
			return true;
		case 'object':
			return value instanceof Boolean;
		default:
			return false;
	}
}

function isNumber(value) {
	switch (typeof value) {
		case 'number':
			return true;
		case 'object':
			return value instanceof Number;
		default:
			return false;
	}
}

function isString(value) {
	switch (typeof value) {
		case 'string':
			return true;
		case 'object':
			return value instanceof String;
		default:
			return false;
	}
}

function isFunction(value) {
	return typeof value === 'function';
}

export default {
	toBoolean: toBoolean,
	toNumber: toNumber,
	toString: toString,
	isBoolean: isBoolean,
	isNumber: isNumber,
	isString: isString,
	isFunction: isFunction
};