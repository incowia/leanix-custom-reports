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

import Utilities from './Utilities';

class ReportState {

	constructor() {
		this._defaultValues = {};
		this._values = {};
		this._state = {};
	}

	prepareValue(key, allowedValues, defaultValue) {
		if (!key) {
			return;
		}
		if (allowedValues && (!Array.isArray(allowedValues) && typeof allowedValues !== 'function')) {
			throw 'Allowed values must be contained in an array or it must be a function.';
		}
		this._values[key] = allowedValues;
		_checkValue(key, allowedValues, defaultValue);
		this._defaultValues[key] = defaultValue;
		// also set one for the state
		this._state[key] = undefined;
	}

	prepareBooleanValue(key, defaultValue) {
		this.prepareValue(key, [true, false], defaultValue);
	}

	prepareRangeValue(key, min, max, steps, defaultValue) {
		const range = [];
		for (let i = min; i < max; i = i + steps) {
			range.push(i);
		}
		range.push(max);
		this.prepareValue(key, range, defaultValue);
	}

	get(key) {
		if (!key) {
			return;
		}
		const value = this._state[key];
		return !value ? this._defaultValues[key] : value;
	}

	getAllowedValues(key) {
		if (!key || !this._values[key]) {
			return [];
		}
		return this._values[key];
	}

	getAll() {
		const result = {};
		for (let key in this._state) {
			const value = this.get(key);
			if (Array.isArray(value)) {
				result[key] = Utilities.copyArray(value, true);
			} else if (typeof value === 'object') {
				result[key] = Utilities.copyObject(value, true);
			} else {
				result[key] = value;
			}
		}
		return result;
	}

	set(key, value) {
		if (!key) {
			return;
		}
		const values = this._values[key];
		_checkValue(key, values, value);
		return _setValue(this._state, key, value);
	}

	update(obj) {
		if (!obj) {
			return;
		}
		// first check all values before updating anything
		for (let key in obj) {
			const values = this._values[key];
			_checkValue(key, values, obj[key]);
		}
		const oldValues = {};
		for (let key in obj) {
			oldValues[key] = _setValue(this._state, key, obj[key]);
		}
		return oldValues;
	}

	reset() {
		for (let key in this._state) {
			this._state[key] = undefined;
		}
	}

	restore(newState, fromSetup) {
		if (!newState) {
			return;
		}
		// extract from setup?
		if (fromSetup) {
			if (newState.savedState && newState.savedState.customState) {
				newState = newState.savedState.customState;
			} else {
				return;
			}
		}
		try {
			this.update(newState);
		} catch (err) {
			// error happens because the bookmark contains values that are no longer supported
			throw err + ' Please delete this bookmark.';
		}
	}

	publish() {
		lx.publishState(this._state);
	}
}

function _checkValue(key, allowedValues, value) {
	// TODO function should response w/ a detailed error msg if something is wrong
	if (allowedValues && (Array.isArray(allowedValues) ? !allowedValues.includes(value) : !allowedValues(value))) {
		throw 'Given value "' + JSON.stringify(value) + '" is not allowed for key "' + key + '".';
	}
}

function _setValue(state, key, value) {
	const oldValue = state[key];
	state[key] = value;
	return oldValue;
}

export default ReportState;
