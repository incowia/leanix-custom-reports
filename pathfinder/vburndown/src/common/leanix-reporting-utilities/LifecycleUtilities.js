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

import Lifecycle from './Lifecycle';

const PLAN = 'plan';
const PHASE_IN = 'phaseIn';
const ACTIVE = 'active';
const PHASE_OUT = 'phaseOut';
const END_OF_LIFE = 'endOfLife';

const DEFAULT_MODEL = {
	phases: [PLAN, PHASE_IN, ACTIVE, PHASE_OUT, END_OF_LIFE],
	previous: (phase) => {
		switch (phase) {
			case END_OF_LIFE:
				return PHASE_OUT;
			case PHASE_OUT:
				return ACTIVE;
			case ACTIVE:
				return PHASE_IN;
			case PHASE_IN:
				return PLAN;
			case PLAN:
			default:
				return;
		}
	},
	next: (phase) => {
		switch (phase) {
			case PLAN:
				return PHASE_IN;
			case PHASE_IN:
				return ACTIVE;
			case ACTIVE:
				return PHASE_OUT;
			case PHASE_OUT:
				return END_OF_LIFE;
			case END_OF_LIFE:
			default:
				return;
		}
	}
};
Object.freeze(DEFAULT_MODEL);

function hasLifecycles(node) {
	return node && node.lifecycle && node.lifecycle.phases
	 && Array.isArray(node.lifecycle.phases) && node.lifecycle.phases.length > 0;
}

function getLifecycles(node, model) {
	if (!hasLifecycles(node)) {
		return [];
	}
	model = _getModel(model);
	const lifecycles = node.lifecycle.phases.map((e) => {
		return new Lifecycle(_parseDateString(e.startDate), e.name);
	});
	// set end, previous & next properties
	lifecycles.forEach((e) => {
		const previous = getByPhase(lifecycles, model.previous(e.name));
		if (previous) {
			e.previous = previous;
		}
		const next = getByPhase(lifecycles, model.next(e.name));
		if (next) {
			e.next = next;
			e.end = next.end;
		}
	});
}

function _getModel(model) {
	return !model ? DEFAULT_MODEL : model;
}

function _parseDateString(date) {
	const result = Date.parse(date + ' 00:00:00');
	if (Number.isNaN(result)) {
		const values = date.split('-');
		return new Date(parseInt(values[0], 10), parseInt(values[1], 10) - 1, parseInt(values[2], 10)).getTime();
	}
	return result;
}

function getPrevious(lifecycles, lifecycle, model) {
	return _getSeqByPhase(lifecycles, lifecycle, model, 'previous');
}

function getNext(lifecycles, lifecycle, model) {
	return _getSeqByPhase(lifecycles, lifecycle, model, 'next');
}

function _getSeqByPhase(lifecycles, lifecycle, model, seqKey) {
	model = _getModel(model);
	if (typeof lifecycle === 'string' || lifecycle instanceof String) {
		// 'lifecycle' is the name of the phase
		lifecycle = getByPhase(lifecycles, lifecycle);
	}
	if (!lifecycle) {
		return;
	}
	let p = getByPhase(lifecycles, model[seqKey](lifecycle.name));
	while (!p) {
		const phaseKey = model[seqKey](lifecycle.name);
		if (!phaseKey) {
			break;
		}
		p = getByPhase(lifecycles, phaseKey);
	}
	return p;
}

function getByDate(lifecycles, date) {
	if (!lifecycles) {
		return;
	}
	for (let i = 0; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (lifecycle && lifecycle.contains(date)) {
			return lifecycle;
		}
	}
}

function getByPhase(lifecycles, phase) {
	if (!lifecycles || !phase) {
		return;
	}
	for (let i = 0; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (lifecycle && lifecycle.name === phase) {
			return lifecycle;
		}
	}
}

function getDataModel(setup, factsheetName) {
	if (!setup) {
		return [];
	}
	if (factsheetName) {
		return _getModelDataValues(setup.settings.dataModel.factSheets[factsheetName]);
	} else {
		const set = {};
		const factsheets = setup.settings.dataModel.factSheets;
		for (let key in factsheets) {
			const mdValues = _getModelDataValues(factsheets[key]);
			mdValues.forEach((e) => {
				set[e] = null;
			});
		}
		return Object.keys(set);
	}
}

function _getModelDataValues(factsheetModel) {
	if (!factsheetModel ||
		!factsheetModel.fields ||
		!factsheetModel.fields.lifecycle ||
		factsheetModel.fields.lifecycle.type !== 'LIFECYCLE' ||
		!Array.isArray(factsheetModel.fields.lifecycle.values)) {
		return [];
	}
	return factsheetModel.fields.lifecycle.values;
}

export default {
	DEFAULT_MODEL: DEFAULT_MODEL,
	hasLifecycles: hasLifecycles,
	getLifecycles: getLifecycles,
	getPrevious: getPrevious,
	getNext: getNext,
	getByDate: getByDate,
	getByPhase: getByPhase,
	getDataModel: getDataModel
};