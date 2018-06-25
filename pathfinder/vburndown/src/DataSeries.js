import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
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

function createRetired() {
	return create('Retired',
		[LifecycleUtilities.DEFAULT_MODEL_PHASE_END_OF_LIFE],
		Constants.DATA_SERIES_TYPE_BAR_NEGATIVE,
		Constants.DATA_SERIES_AXIS_Y,
		Constants.DATA_SERIES_COUNT_FIRST);
}

export default {
	create: create,
	createDemo: createDemo,
	createInPlanningStage: createInPlanningStage,
	createInProduction: createInProduction,
	createRetired: createRetired
};