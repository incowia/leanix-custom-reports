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
		return new Lifecycle(_parseDateString(e.startDate), e.phase);
	}).sort(getLifecycleSorter(model));
	// set end, previous & next properties
	lifecycles.forEach((e) => {
		const previous = getPrevious(lifecycles, e, model);
		if (previous) {
			e.previous = previous;
		}
		const next = getNext(lifecycles, e, model);
		if (next) {
			e.next = next;
			e.end = next.start;
		}
	});
	return lifecycles;
}

function getLifecycleSorter(model) {
	model = _getModel(model);
	return (first, second) => {
		const firstIndex = model.phases.indexOf(first.name ? first.name : first);
		const secondIndex = model.phases.indexOf(second.name ? second.name : second);
		return firstIndex - secondIndex;
	};
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
	let lastPhaseKey = lifecycle.name;
	let p = getByPhase(lifecycles, model[seqKey](lastPhaseKey));
	while (!p) {
		lastPhaseKey = model[seqKey](lastPhaseKey);
		if (!lastPhaseKey) {
			break;
		}
		p = getByPhase(lifecycles, lastPhaseKey);
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

function getDataModelValues(setup, factsheetType) {
	if (!setup) {
		return [];
	}
	if (factsheetType) {
		return _getModelDataValues(setup.settings.dataModel.factSheets[factsheetType]);
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

function _getModelDataValues(factsheetDataModel) {
	if (!factsheetDataModel ||
		!factsheetDataModel.fields ||
		!factsheetDataModel.fields.lifecycle ||
		factsheetDataModel.fields.lifecycle.type !== 'LIFECYCLE' ||
		!Array.isArray(factsheetDataModel.fields.lifecycle.values)) {
		return [];
	}
	return factsheetDataModel.fields.lifecycle.values;
}

function translateDataModelValues(setup, dataModelValues, factsheetType) {
	if (!setup) {
		return [];
	}
	if (!dataModelValues) {
		dataModelValues = getDataModelValues(setup, factsheetType);
	}
	if (factsheetType) {
		return dataModelValues.map((e) => {
			return lx.translateFieldValue(factsheetType, 'lifecycle', e);
		});
	} else {
		const set = {};
		const factsheets = setup.settings.dataModel.factSheets;
		for (let key in factsheets) {
			const mdValues = _getModelDataValues(factsheets[key]);
			mdValues.forEach((e) => {
				set[e] = lx.translateFieldValue(key, 'lifecycle', e);
			});
		}
		return Utilities.getValues(set);
	}
}

export default {
	DEFAULT_MODEL_PHASE_PLAN: PLAN,
	DEFAULT_MODEL_PHASE_PHASE_IN: PHASE_IN,
	DEFAULT_MODEL_PHASE_ACTIVE: ACTIVE,
	DEFAULT_MODEL_PHASE_PHASE_OUT: PHASE_OUT,
	DEFAULT_MODEL_PHASE_END_OF_LIFE: END_OF_LIFE,
	DEFAULT_MODEL: DEFAULT_MODEL,
	hasLifecycles: hasLifecycles,
	getLifecycles: getLifecycles,
	getLifecycleSorter: getLifecycleSorter,
	getPrevious: getPrevious,
	getNext: getNext,
	getByDate: getByDate,
	getByPhase: getByPhase,
	getDataModelValues: getDataModelValues,
	translateDataModelValues: translateDataModelValues
};