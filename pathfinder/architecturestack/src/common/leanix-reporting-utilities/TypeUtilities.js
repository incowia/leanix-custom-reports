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