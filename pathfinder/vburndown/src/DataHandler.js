import Utilities from './common/leanix-reporting-utilities/Utilities';
import DateUtilities from './common/leanix-reporting-utilities/DateUtilities';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import DateRange from './common/leanix-reporting-utilities/DateRange';
import Constants from './Constants';

/*
dataSeries = {
	name: 'name',
	lifecycles: ['lifecycle'],
	type: 'type',
	stack: 'stack'
};
*/

function create(nodes, unit, startYearDistance, endYearDistance, dataSeries) {
	const xAxis = _createXAxisVars(unit, startYearDistance, endYearDistance);
	const dateIntervals = _createDateIntervals(xAxis);
	const categories = dateIntervals.map((e) => {
		return e.name;
	});
	const tableData = {};
	dateIntervals.forEach((e) => {
		tableData[e.name] = {};
	});
	const chartData = [
		['time'].concat(categories)
	];
	dataSeries.forEach((dataSerie, i) => {
		const dataSeriesValues = [dataSerie.name];
		chartData.push(dataSeriesValues);
		const inverseValues = dataSerie.type.endsWith('-');
		const filteredNodes = nodes.filter((node) => {
			// only include nodes that have matching lifecycles
			if (!node.lifecycle) {
				return false;
			}
			const nodeLifecycles = node.lifecycle.map((e) => {
				return e.name;
			});
			return Utilities.containsAny(nodeLifecycles, dataSerie.lifecycles);
		});
		dateIntervals.forEach((dateInterval) => {
			let value = 0;
			filteredNodes.forEach((node) => {
				if (_countIf(node, dateInterval, dataSerie)) {
					value++;
					tableData[dateInterval.name][node.id] = node;
				}
			});
			dataSeriesValues.push(inverseValues && value !== 0 ? -value : value);
		});
	});
	for (let key in tableData) {
		tableData[key] = Utilities.getValues(tableData[key]).sort((first, second) => {
			return first.displayName.localeCompare(second.displayName);
		});
	}
	return {
		xAxis: xAxis,
		chartData: chartData,
		tableData: tableData
	};
}

function _countIf(node, dateInterval, dataSeries) {
	const dataSeriesLifecycles = dataSeries.lifecycles;
	const nodeLifecycles = node.lifecycle.filter((e) => {
		return dataSeriesLifecycles.includes(e.name);
	});
	const stack = dataSeries.stack;
	switch (stack) {
		case Constants.DATA_SERIES_STACK_LAST:
			const latestNodeLifecycle = LifecycleUtilities.getLatest(nodeLifecycles);
			// please note: lifecycle.getEnd() is exclusive!
			return dateInterval.range.contains(latestNodeLifecycle.getEnd() - 1);
		case Constants.DATA_SERIES_STACK_FIRST:
			const earliestNodeLifecycle = LifecycleUtilities.getEarliest(nodeLifecycles);
			// please note: lifecycle.getStart() is inclusive!
			return dateInterval.range.contains(earliestNodeLifecycle.getStart());
		case Constants.DATA_SERIES_STACK_EVERY:
			return nodeLifecycles.some((e) => {
				return dateInterval.range.overlaps(e);
			});
			break;
		default:
			throw 'Unknown stack: ' + stack;
	}
}

function _createXAxisVars(unit, startYearDistance, endYearDistance) {
	const current = DateUtilities.getCurrent();
	let start = DateUtilities.minusYears(current, startYearDistance);
	let end = DateUtilities.plusYears(current, endYearDistance);
	switch (unit) {
		case Constants.X_AXIS_UNIT_MONTHS:
			start = DateUtilities.getFirstDayOfMonth(start);
			end = DateUtilities.getLastDayOfMonth(end);
			break;
		case Constants.X_AXIS_UNIT_QUARTERS:
			start = DateUtilities.getFirstDayOfQuarter(start);
			end = DateUtilities.getLastDayOfQuarter(end);
			break;
		case Constants.X_AXIS_UNIT_YEARS:
			start = DateUtilities.getFirstDayOfYear(start);
			end = DateUtilities.getLastDayOfYear(end);
			break;
		default:
			throw 'Unknown X Axis unit: ' + unit;
	}
	return {
		current: current,
		start: start,
		end: end,
		unit: unit
	};
}

function _createDateIntervals(xAxis) {
	// PLEASE NOTE: the 'diff' computation assumes that start & end differ by years exactly!
	const result = [];
	let tmpStart = new Date(xAxis.start);
	let tmpEnd = new Date(xAxis.start);
	switch (xAxis.unit) {
		case Constants.X_AXIS_UNIT_MONTHS:
			tmpEnd = new Date(DateUtilities.getNextMonth(tmpEnd));
			const diffMonths = (new Date(xAxis.end).getFullYear() - tmpStart.getFullYear()) * 12 + 1;
			for (let i = 0; i < diffMonths; i++) {
				result.push({
					// TODO date format?
					name: tmpStart.getFullYear() + '-' + (tmpStart.getMonth() + 1),
					range: new DateRange(tmpStart, tmpEnd, true, false)
				});
				tmpStart = new Date(DateUtilities.getNextMonth(tmpStart));
				tmpEnd = new Date(DateUtilities.getNextMonth(tmpEnd));
			}
			break;
		case Constants.X_AXIS_UNIT_QUARTERS:
			tmpEnd = new Date(DateUtilities.getNextQuarter(tmpEnd));
			const diffQuarters = (new Date(xAxis.end).getFullYear() - tmpStart.getFullYear()) * 4 + 1;
			for (let i = 0; i < diffQuarters; i++) {
				result.push({
					name: tmpStart.getFullYear() + '-' + DateUtilities.getQuarterString(tmpStart),
					range: new DateRange(tmpStart, tmpEnd, true, false)
				});
				tmpStart = new Date(DateUtilities.getNextQuarter(tmpStart));
				tmpEnd = new Date(DateUtilities.getNextQuarter(tmpEnd));
			}
			break;
		case Constants.X_AXIS_UNIT_YEARS:
			tmpEnd.setFullYear(tmpEnd.getFullYear() + 1);
			const diffYears = new Date(xAxis.end).getFullYear() - tmpStart.getFullYear() + 1;
			for (let i = 0; i < diffYears; i++) {
				result.push({
					name: '' + tmpStart.getFullYear(),
					range: new DateRange(tmpStart, tmpEnd, true, false)
				});
				tmpStart.setFullYear(tmpStart.getFullYear() + 1);
				tmpEnd.setFullYear(tmpEnd.getFullYear() + 1);
			}
			break;
		default:
			throw 'Unknown X Axis unit: ' + unit;
	}
	return result;
}

export default {
	create: create
};