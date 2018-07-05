import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import TypeUtilities from './common/leanix-reporting-utilities/TypeUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import Constants from './Constants';

function create(name, lifecycles, type, axis, count) {
	return {
		name: name,
		lifecycles: lifecycles,
		type: type,
		axis: axis,
		count: count
	};
}

function createDemo(lifecycleModel) {
	return create('Demo series',
		[lifecycleModel[0]],
		Constants.DATA_SERIES_TYPE_BAR_POSITIVE,
		Constants.DATA_SERIES_AXIS_Y,
		Constants.DATA_SERIES_COUNT_EVERY);
}

function createInPlanningStage() {
	return create('In planning stage',
		[LifecycleUtilities.DEFAULT_MODEL_PHASE_PLAN],
		Constants.DATA_SERIES_TYPE_BAR_POSITIVE,
		Constants.DATA_SERIES_AXIS_Y,
		Constants.DATA_SERIES_COUNT_LAST);
}

function createInProduction(inProductionLifecycles) {
	return create('In production',
		inProductionLifecycles,
		Constants.DATA_SERIES_TYPE_SPLINE_POSITIVE,
		Constants.DATA_SERIES_AXIS_Y2,
		Constants.DATA_SERIES_COUNT_EVERY);
}

function createRetiring() {
	return create('Retiring',
		[LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE],
		Constants.DATA_SERIES_TYPE_BAR_NEGATIVE,
		Constants.DATA_SERIES_AXIS_Y,
		Constants.DATA_SERIES_COUNT_FIRST);
}

/*
 used also for other configuration options
 \w = Matches any alphanumeric character from the basic Latin alphabet, including the underscore. Equivalent to [A-Za-z0-9_]
 \s = Matches a single white space character. Equivalent to [\f\n\r\t\v\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]

 How to support truely all language letters like ä, á, à etc.?
*/
const LABEL_AND_NAME_REGEXP = /^[\w\s]+$/i;

function validate(lifecycleModelTranslations) {
	const lifecycleModel = Object.keys(lifecycleModelTranslations);
	const lmts = Utilities.getValues(lifecycleModelTranslations);
	return (v, k) => {
		if (!Array.isArray(v) || v.length < 1) {
			return 'Provided value must be a non-empty array.';
		}
		const errors = {};
		const set = {}; // used for name duplication check
		const duplicates = [];
		for (let i = 0; i < v.length; i++) {
			const dataSeries = v[i];
			if (set[dataSeries.name]) {
				duplicates.push(i);
			} else {
				set[dataSeries.name] = i;
			}
			if (!TypeUtilities.isString(dataSeries.name) || !LABEL_AND_NAME_REGEXP.test(dataSeries.name.trim())) {
				errors[i] = _addDataSeriesError(errors[i], 'name', 'Each data series needs a display name.');
				delete set[dataSeries.name]; // this error means we can skip duplication check
			}
			if (!Array.isArray(dataSeries.lifecycles) || dataSeries.lifecycles.length < 1) {
				errors[i] = _addDataSeriesError(errors[i], 'lifecycles', 'Each data series needs at least one lifecycle phase to use.');
			} else {
				for (let j = 0; j < dataSeries.lifecycles.length; j++) {
					const phase = dataSeries.lifecycles[j];
					if (!TypeUtilities.isString(phase) || !lifecycleModel.includes(phase)) {
						errors[i] = _addDataSeriesError(errors[i], 'lifecycles', 'Provided lifecycle phases must be one of ' + lmts.join(', ') + '.');
					}
				}
			}
			if (!Constants.DATA_SERIES_TYPES.includes(dataSeries.type)) {
				errors[i] = _addDataSeriesError(errors[i], 'type', 'Provided type must be one of ' + Constants.DATA_SERIES_TYPES.join(', ') + '.');
			}
			if (!Constants.DATA_SERIES_AXES.includes(dataSeries.axis)) {
				errors[i] = _addDataSeriesError(errors[i], 'axis', 'Provided Y axis must be one of ' + Constants.DATA_SERIES_AXES.join(', ') + '.');
			}
			if (!Constants.DATA_SERIES_COUNTS.includes(dataSeries.count)) {
				errors[i] = _addDataSeriesError(errors[i], 'count', 'Provided count method must be one of ' + Constants.DATA_SERIES_COUNTS.join(', ') + '.');
			}
		}
		// add duplication errors
		duplicates.forEach((e) => {
			const dataSeries = v[e];
			if (TypeUtilities.isNumber(set[dataSeries.name])) {
				const i = set[dataSeries.name];
				errors[i] = _addDataSeriesError(errors[i], 'name', 'Each data series needs an unique display name.');
				delete set[dataSeries.name];
			}
			errors[e] = _addDataSeriesError(errors[e], 'name', 'Each data series needs an unique display name.');
		});
		if (Object.keys(errors).length > 0) {
			return errors;
		}
	};
}

function _addDataSeriesError(err, prop, message) {
	const result = err ? err : {};
	let propErr = result[prop];
	if (!propErr) {
		propErr = [];
		result[prop] = propErr;
	}
	propErr.push(message);
	return result;
}

export default {
	create: create,
	createDemo: createDemo,
	createInPlanningStage: createInPlanningStage,
	createInProduction: createInProduction,
	createRetiring: createRetiring,
	LABEL_AND_NAME_REGEXP: LABEL_AND_NAME_REGEXP,
	validate: validate
};