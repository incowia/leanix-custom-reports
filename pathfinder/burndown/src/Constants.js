import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';

const X_AXIS_UNIT_MONTHS = 'Months';
const X_AXIS_UNIT_QUARTERS = 'Quarters';
const X_AXIS_UNIT_YEARS = 'Years';
const X_AXIS_UNIT_OPTIONS = [{
		value: X_AXIS_UNIT_MONTHS,
		label: X_AXIS_UNIT_MONTHS
	}, {
		value: X_AXIS_UNIT_QUARTERS,
		label: X_AXIS_UNIT_QUARTERS
	}, {
		value: X_AXIS_UNIT_YEARS,
		label: X_AXIS_UNIT_YEARS
	}
];
const X_AXIS_UNITS = X_AXIS_UNIT_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_TYPE_BAR_POSITIVE = 'bar+';
const DATA_SERIES_TYPE_BAR_NEGATIVE = 'bar-';
const DATA_SERIES_TYPE_LINE_POSITIVE = 'line+';
const DATA_SERIES_TYPE_LINE_NEGATIVE = 'line-';
const DATA_SERIES_TYPE_SPLINE_POSITIVE = 'spline+';
const DATA_SERIES_TYPE_SPLINE_NEGATIVE = 'spline-';
const DATA_SERIES_TYPE_AREA_POSITIVE = 'area+';
const DATA_SERIES_TYPE_AREA_NEGATIVE = 'area-';
const DATA_SERIES_TYPE_AREA_SPLINE_POSITIVE = 'area-spline+';
const DATA_SERIES_TYPE_AREA_SPLINE_NEGATIVE = 'area-spline-';
const DATA_SERIES_TYPE_OPTIONS = [{
		value: DATA_SERIES_TYPE_BAR_POSITIVE,
		label: 'Bar positive'
	}, {
		value: DATA_SERIES_TYPE_BAR_NEGATIVE,
		label: 'Bar negative'
	}, {
		value: DATA_SERIES_TYPE_LINE_POSITIVE,
		label: 'Line positive'
	}, {
		value: DATA_SERIES_TYPE_LINE_NEGATIVE,
		label: 'Line negative'
	}, {
		value: DATA_SERIES_TYPE_SPLINE_POSITIVE,
		label: 'Spline positive'
	}, {
		value: DATA_SERIES_TYPE_SPLINE_NEGATIVE,
		label: 'Spline negative'
	}, {
		value: DATA_SERIES_TYPE_AREA_POSITIVE,
		label: 'Area positive'
	}, {
		value: DATA_SERIES_TYPE_AREA_NEGATIVE,
		label: 'Area negative'
	}, {
		value: DATA_SERIES_TYPE_AREA_SPLINE_POSITIVE,
		label: 'Area Spline positive'
	}, {
		value: DATA_SERIES_TYPE_AREA_SPLINE_NEGATIVE,
		label: 'Area Spline negative'
	}
];
const DATA_SERIES_TYPES = DATA_SERIES_TYPE_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_COUNT_LAST = 'last';
const DATA_SERIES_COUNT_FIRST = 'first';
const DATA_SERIES_COUNT_EVERY = 'every';
const DATA_SERIES_COUNT_OPTIONS = [{
		value: DATA_SERIES_COUNT_LAST,
		label: 'Only last occurrence'
	}, {
		value: DATA_SERIES_COUNT_FIRST,
		label: 'Only first occurrence'
	}, {
		value: DATA_SERIES_COUNT_EVERY,
		label: 'Every occurrence'
	}
];
const DATA_SERIES_COUNTS = DATA_SERIES_COUNT_OPTIONS.map((e) => {
	return e.value;
});

const DATA_SERIES_AXIS_Y = 'y';
const DATA_SERIES_AXIS_Y2 = 'y2';
const DATA_SERIES_AXIS_OPTIONS = [{
		value: DATA_SERIES_AXIS_Y,
		label: 'Y'
	}, {
		value: DATA_SERIES_AXIS_Y2,
		label: 'Y2'
	}
];
const DATA_SERIES_AXES = DATA_SERIES_AXIS_OPTIONS.map((e) => {
	return e.value;
});

function getDataSeriesLifecycleOptions(setup, factsheetType) {
	const lifecycleModel = LifecycleUtilities.getModel(setup, factsheetType);
	const lifecycleModelTranslations = LifecycleUtilities.translateModel(lifecycleModel, factsheetType);
	return lifecycleModel.map((e, i) => {
		return {
			value: e,
			label: lifecycleModelTranslations[e]
		};
	});
}

export default {
	X_AXIS_UNIT_MONTHS: X_AXIS_UNIT_MONTHS,
	X_AXIS_UNIT_QUARTERS: X_AXIS_UNIT_QUARTERS,
	X_AXIS_UNIT_YEARS: X_AXIS_UNIT_YEARS,
	X_AXIS_UNIT_OPTIONS: X_AXIS_UNIT_OPTIONS,
	X_AXIS_UNITS: X_AXIS_UNITS,
	DATA_SERIES_TYPE_BAR_POSITIVE: DATA_SERIES_TYPE_BAR_POSITIVE,
	DATA_SERIES_TYPE_BAR_NEGATIVE: DATA_SERIES_TYPE_BAR_NEGATIVE,
	DATA_SERIES_TYPE_LINE_POSITIVE: DATA_SERIES_TYPE_LINE_POSITIVE,
	DATA_SERIES_TYPE_LINE_NEGATIVE: DATA_SERIES_TYPE_LINE_NEGATIVE,
	DATA_SERIES_TYPE_SPLINE_POSITIVE: DATA_SERIES_TYPE_SPLINE_POSITIVE,
	DATA_SERIES_TYPE_SPLINE_NEGATIVE: DATA_SERIES_TYPE_SPLINE_NEGATIVE,
	DATA_SERIES_TYPE_AREA_POSITIVE: DATA_SERIES_TYPE_AREA_POSITIVE,
	DATA_SERIES_TYPE_AREA_NEGATIVE: DATA_SERIES_TYPE_AREA_NEGATIVE,
	DATA_SERIES_TYPE_AREA_SPLINE_POSITIVE: DATA_SERIES_TYPE_AREA_SPLINE_POSITIVE,
	DATA_SERIES_TYPE_AREA_SPLINE_NEGATIVE: DATA_SERIES_TYPE_AREA_SPLINE_NEGATIVE,
	DATA_SERIES_TYPE_OPTIONS: DATA_SERIES_TYPE_OPTIONS,
	DATA_SERIES_TYPES: DATA_SERIES_TYPES,
	DATA_SERIES_COUNT_LAST: DATA_SERIES_COUNT_LAST,
	DATA_SERIES_COUNT_FIRST: DATA_SERIES_COUNT_FIRST,
	DATA_SERIES_COUNT_EVERY: DATA_SERIES_COUNT_EVERY,
	DATA_SERIES_COUNT_OPTIONS: DATA_SERIES_COUNT_OPTIONS,
	DATA_SERIES_COUNTS: DATA_SERIES_COUNTS,
	DATA_SERIES_AXIS_Y: DATA_SERIES_AXIS_Y,
	DATA_SERIES_AXIS_Y2: DATA_SERIES_AXIS_Y2,
	DATA_SERIES_AXIS_OPTIONS: DATA_SERIES_AXIS_OPTIONS,
	DATA_SERIES_AXES: DATA_SERIES_AXES,
	getDataSeriesLifecycleOptions: getDataSeriesLifecycleOptions
};