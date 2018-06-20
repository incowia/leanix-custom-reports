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

const DEFAULT_MODEL = [PLAN, PHASE_IN, ACTIVE, PHASE_OUT, END_OF_LIFE];
Object.freeze(DEFAULT_MODEL);

const GRAPHQL_ATTRIBUTE = 'lifecycle { phases { phase startDate } }';

function hasLifecycles(node) {
	return node && node.lifecycle && node.lifecycle.phases
	 && Array.isArray(node.lifecycle.phases) && node.lifecycle.phases.length > 0;
}

function getLifecycles(node, model) {
	if (!model || !hasLifecycles(node)) {
		return [];
	}
	const lifecycles = node.lifecycle.phases.map((e) => {
		return new Lifecycle(_parseDateString(e.startDate), e.phase);
	}).sort(getSorter(model));
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

function getSorter(model) {
	if (!model) {
		return;
	}
	return (first, second) => {
		const firstIndex = model.indexOf(first.name ? first.name : first);
		const secondIndex = model.indexOf(second.name ? second.name : second);
		return firstIndex - secondIndex;
	};
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
	return _getSeqByPhase(lifecycles, lifecycle, model, _getPreviousPhaseKey);
}

function getNext(lifecycles, lifecycle, model) {
	return _getSeqByPhase(lifecycles, lifecycle, model, _getNextPhaseKey);
}

function _getSeqByPhase(lifecycles, lifecycle, model, getPhaseKey) {
	if (!lifecycles || !model) {
		return;
	}
	if (typeof lifecycle === 'string' || lifecycle instanceof String) {
		// 'lifecycle' is the name of the phase
		lifecycle = getByPhase(lifecycles, lifecycle);
	}
	if (!lifecycle) {
		return;
	}
	let lastPhaseKey = lifecycle.name;
	let p = getByPhase(lifecycles, getPhaseKey(lastPhaseKey, model));
	while (!p) {
		lastPhaseKey = getPhaseKey(lastPhaseKey, model);
		if (!lastPhaseKey) {
			break;
		}
		p = getByPhase(lifecycles, lastPhaseKey);
	}
	return p;
}

function _getPreviousPhaseKey(current, model) {
	const currentIndex = model.indexOf(current);
	return currentIndex > -1 ? model[currentIndex - 1] : undefined;
}

function _getNextPhaseKey(current, model) {
	const currentIndex = model.indexOf(current);
	return currentIndex > -1 ? model[currentIndex + 1] : undefined;
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

function getLatest(lifecycles) {
	if (!lifecycles) {
		return;
	}
	let result = lifecycles[0];
	for (let i = 1; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (result.getEnd() <= lifecycle.getEnd()) {
			result = lifecycle;
		}
	}
	return result;
}

function getEarliest(lifecycles) {
	if (!lifecycles) {
		return;
	}
	let result = lifecycles[0];
	for (let i = 1; i < lifecycles.length; i++) {
		const lifecycle = lifecycles[i];
		if (result.getStart() >= lifecycle.getStart()) {
			result = lifecycle;
		}
	}
	return result;
}

function getModel(setup, factsheetType) {
	if (!setup || !factsheetType) {
		return [];
	}
	return _getModelDataValues(setup.settings.dataModel.factSheets[factsheetType]);
}

function _getModelDataValues(factsheetDataModel) {
	if (!factsheetDataModel ||
		!factsheetDataModel.fields ||
		!factsheetDataModel.fields.lifecycle ||
		factsheetDataModel.fields.lifecycle.type !== 'LIFECYCLE' ||
		!Array.isArray(factsheetDataModel.fields.lifecycle.values)) {
		return [];
	}
	return Utilities.copyArray(factsheetDataModel.fields.lifecycle.values);
}

function translateModel(setup, model, factsheetType) {
	if (!setup || !factsheetType) {
		return [];
	}
	if (!model) {
		model = getModel(setup, factsheetType);
	}
	return model.map((e) => {
		return lx.translateFieldValue(factsheetType, 'lifecycle', e);
	});
}

export default {
	DEFAULT_MODEL_PHASE_PLAN: PLAN,
	DEFAULT_MODEL_PHASE_PHASE_IN: PHASE_IN,
	DEFAULT_MODEL_PHASE_ACTIVE: ACTIVE,
	DEFAULT_MODEL_PHASE_PHASE_OUT: PHASE_OUT,
	DEFAULT_MODEL_PHASE_END_OF_LIFE: END_OF_LIFE,
	DEFAULT_MODEL: DEFAULT_MODEL,
	GRAPHQL_ATTRIBUTE: GRAPHQL_ATTRIBUTE,
	hasLifecycles: hasLifecycles,
	getLifecycles: getLifecycles,
	getSorter: getSorter,
	getPrevious: getPrevious,
	getNext: getNext,
	getByDate: getByDate,
	getByPhase: getByPhase,
	getLatest: getLatest,
	getEarliest: getEarliest,
	getModel: getModel,
	translateModel: translateModel
};