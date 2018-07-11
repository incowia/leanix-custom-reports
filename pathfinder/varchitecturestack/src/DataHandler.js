import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import Constants from './Constants';

// TODO view model to own file

function createViewModels(setup, allViewInfos, tagGroups, getRangeValues) {
	const viewModelsPerFactsheet = {};
	for (let factsheetType in allViewInfos) {
		const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + factsheetType + '.fields');
		const viewInfos = allViewInfos[factsheetType].viewInfos.filter((e) => {
			const usesRangeLegend = e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false;
			switch (e.type) {
				case 'FIELD':
					return _checkFieldType(fieldModels[e.key].type);
				case 'TAG':
					// format: 'tags.<TAG_GROUP_ID>'
					return _checkTagGroup(e.key.slice(5), tagGroups);
				case 'FIELD_RELATION':
					// format: '<RELATION>.<RELATION_FIELD>'
					return _checkRelField(e.key.split('.'), usesRangeLegend, setup);
				case 'FIELD_TARGET_FS':
					// format: '<RELATION>.<FACTSHEET_TYPE>.<FIELD>'
					return _checkTargetValue(e.key.split('.'), usesRangeLegend, setup);
				case 'BUILT_IN':
					// the 'build in' stuff is specific for leanix itself,
					// not relevant for the report
					return false;
				default:
					console.error('Unknown viewInfo type "' + e.type + '".');
					return false;
			}
		});
		// TODO add multiple-selectable tag groups to viewModels
		const viewModels = viewInfos.map((e) => {
			const usesRangeLegend = e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false;
			switch (e.type) {
				case 'FIELD':
					return {
						type: fieldModels[e.key].type,
						subType: undefined,
						values: fieldModels[e.key].values,
						key: e.key,
						value: e.key,
						label: lx.translateField(factsheetType, e.key),
						originalLabel: e.label,
						rangeLegend: usesRangeLegend
					};
				case 'TAG':
					const tagGroupID = e.key.slice(5); // format: 'tags.<TAG_GROUP_ID>'
					return {
						type: e.type,
						subType: undefined,
						values: tagGroups[tagGroupID].tags.nodes,
						key: e.key,
						value: tagGroupID,
						label: 'Tag group: ' + e.label,
						originalLabel: e.label,
						rangeLegend: usesRangeLegend
					};
				case 'FIELD_RELATION':
					const relFieldValue = e.key.split('.'); // format: '<RELATION>.<RELATION_FIELD>'
					const relFieldModel = ReportSetupUtilities.getRelationModel(setup, relFieldValue[0]);
					return {
						type: e.type,
						subType: relFieldModel.fields[relFieldValue[1]].type,
						values: usesRangeLegend ? undefined : relFieldModel.fields[relFieldValue[1]].values,
						key: e.key,
						value: relFieldValue,
						// TODO see https://github.com/leanix/leanix-reporting/issues/11
						label: lx.translateRelation(relFieldValue[0]) + ': ' + relFieldValue[1],
						originalLabel: e.label,
						rangeLegend: usesRangeLegend
					};
				case 'FIELD_TARGET_FS':
					const relTargetValue = e.key.split('.'); // format: '<RELATION>.<FACTSHEET_TYPE>.<FIELD>'
					const relTargetFieldModel = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + relTargetValue[1] + '.fields');
					return {
						type: e.type,
						subType: relTargetFieldModel[relTargetValue[2]].type,
						values: usesRangeLegend ? undefined : relTargetFieldModel[relTargetValue[2]].values,
						key: e.key,
						value: relTargetValue,
						label: lx.translateRelation(relTargetValue[0]) + ': ' + lx.translateField(relTargetValue[1], relTargetValue[2]),
						originalLabel: e.label,
						rangeLegend: usesRangeLegend
					};
			}
		});
		viewModels.sort((f, s) => {
			const fSortID = _getTypeSortID(f.type);
			const sSortID = _getTypeSortID(s.type);
			if (fSortID === sSortID) {
				return f.label.localeCompare(s.label);
			}
			return fSortID - sSortID;
		});
		// only include those that have more than 1 view model
		if (viewModels.length > 1) {
			viewModelsPerFactsheet[factsheetType] = viewModels;
		}
	}
	return viewModelsPerFactsheet;
}

function _getTypeSortID(type) {
	switch (type) {
		// field types range 0-99
		case 'LIFECYCLE':
			return 0;
		case 'PROJECT_STATUS':
			return 1;
		case 'SINGLE_SELECT':
			return 2;
		case 'FIELD_RELATION':
		case 'FIELD_TARGET_FS':
			return 100;
		case 'TAG':
			return 101;
		default:
			console.error('_getTypeSortID: Unknown type "' + type + '".');
			return 10000;
	}
}

function _checkFieldType(type) {
	switch (type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
		case 'SINGLE_SELECT':
			return true;
		default:
			console.error('_checkFieldType: Unknown type "' + type + '".');
			return false;
	}
}

function _checkTagGroup(id, tagGroups) {
	const tagGroup = tagGroups[id];
	// filter out multi-selectable tags here, b/c the report will add them later
	return tagGroup && tagGroup.mode !== 'MULTIPLE' && tagGroup.tags; // 'tags' is a subIndex
}

function _checkRelField(value, usesRangeLegend, setup) {
	if (value.length !== 2) {
		// expected format didn't match, which need to be fixed by a developer
		return false;
	}
	const relModel = ReportSetupUtilities.getRelationModel(setup, value[0]);
	return relModel && relModel.fields && relModel.fields[value[1]] && (usesRangeLegend ? true : _checkFieldType(relModel.fields[value[1]].type));
}

function _checkTargetValue(value, usesRangeLegend, setup) {
	if (value.length !== 3) {
		// expected format didn't match, which need to be fixed by a developer
		return false;
	}
	const relModel = ReportSetupUtilities.getRelationModel(setup, value[0]);
	if (!relModel) {
		return false;
	}
	const factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup);
	if (!factsheetTypes.includes(value[1])) {
		return false;
	}
	const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + value[1] + '.fields');
	return fieldModels && fieldModels[value[2]] && (usesRangeLegend ? true : _checkFieldType(fieldModels[value[2]].type));
}

function getQueryAttribute(viewModel) {
	const value = viewModel.value;
	switch (viewModel.type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
			return value + ' { asString }';
		case 'SINGLE_SELECT':
			return value;
		case 'FIELD_RELATION':
			if (viewModel.rangeLegend) {
				return value[0] + '{ edges { node { ' + value[1] + ' } } }';
			}
			const subRelFieldViewModel = {
				value: value[1],
				type: viewModel.subType
			};
			return value[0] + '{ edges { node { ' + getQueryAttribute(subRelFieldViewModel) + ' } } }';
		case 'FIELD_TARGET_FS':
			if (viewModel.rangeLegend) {
				return value[0] + '{ edges { node { factSheet { ... on ' + value[1] + ' { ' + value[2] + ' } } } } }';
			}
			const subRelTargetViewModel = {
				value: value[2],
				type: viewModel.subType
			};
			return value[0] + '{ edges { node { factSheet { ... on ' + value[1] + ' { ' + getQueryAttribute(subRelTargetViewModel) + ' } } } } }';
		case 'TAG':
			// TODO maybe 'name' can be removed
			return 'tags { id name }';
		default:
			console.error('getQueryAttribute: Unknown type "' + viewModel.type + '" of data field "' + value + '".');
			return value;
	}
}

function create(setup, factsheetType, viewModel, xAxisModel, yAxisModel, legendItemData) {
	return {
		legendData: _createLegendData(factsheetType, viewModel, legendItemData._rawLegendItems)
	};
}

function _createMatrixDataGrid(factsheetType, xAxisModel, yAxisModel) {
	// TODO
	const result = []; // position (0,0) will always be empty
	// the first row contains the values from the x axis model
	const xAxisValue = xAxisModel.value;
	switch (xAxisModel.type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
		case 'SINGLE_SELECT':
		case 'FIELD_RELATION':
		case 'FIELD_TARGET_FS':
		case 'TAG':
			matrixData.push([undefined].concat(xAxisValues.map((e) => {
				return e;
			})));
			break;
		default:
			console.error('_createMatrixDataGrid: Unknown type "' + xAxisModel.type + '" of data field "' + xAxisValue + '".');
			break;
	}
	return result;
}

function _getAxisLabels(setup, factsheetType, axisModel) {
	// TODO
}

function _createLegendData(factsheetType, viewModel, legendItemData) {
	// TODO use viewModel.values
	const result = [];
	legendItemData.forEach((e) => {
		if (!e.inLegend) {
			return;
		}
		result.push({
			label: _getLabelFunc(factsheetType, viewModel, e.value),
			bgColor: e.bgColor,
			color: e.color
		});
	});
	return result;
}

function _getLabelFunc(factsheetType, viewModel, fallbackValue) {
	if (fallbackValue === '__missing__') {
		// TODO see https://github.com/leanix/leanix-reporting/issues/7
		return () => {
			return 'n/a';
		};
	}
	if (viewModel.rangeLegend) {
		return () => {
			return fallbackValue;
		};
	}
	const value = viewModel.value;
	switch (viewModel.type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
		case 'SINGLE_SELECT':
			return () => {
				return lx.translateFieldValue(factsheetType, value, fallbackValue);
			};
		case 'FIELD_RELATION':
			return () => {
				// TODO see https://github.com/leanix/leanix-reporting/issues/11
				return fallbackValue;
			};
		case 'FIELD_TARGET_FS':
			return () => {
				return lx.translateFieldValue(value[1], value[2], fallbackValue);
			};
		case 'TAG':
			return () => {
				return fallbackValue;
			};
		default:
			console.error('_getLabelFunc: Unknown type "' + viewModel.type + '" of data field "' + value + '".');
			return () => {
				return '';
			};
	}
}

export default {
	createViewModels: createViewModels,
	getQueryAttribute: getQueryAttribute,
	create: create
};