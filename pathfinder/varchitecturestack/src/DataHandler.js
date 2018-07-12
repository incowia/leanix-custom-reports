import TagUtilities from './common/leanix-reporting-utilities/TagUtilities';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import Constants from './Constants';

// TODO view model to own file

function createViewModels(setup, factsheetTypes, allViewInfos, tagGroups) {
	const viewModelsPerFactsheet = {};
	factsheetTypes.forEach((factsheetType) => {
		const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + factsheetType + '.fields');
		const viewModels = {
			views: [],
			xAxis: undefined,
			yAxis: undefined
		};
		allViewInfos[factsheetType].viewInfos.forEach((viewInfo) => {
			const usesRangeLegend = viewInfo.viewOptionSupport ? viewInfo.viewOptionSupport.usesRangeLegend : false;
			let viewModel = {
				key: viewInfo.key,
				originalLabel: viewInfo.label,
				rangeLegend: usesRangeLegend
			};
			switch (viewInfo.type) {
				case 'FIELD':
					const fieldModel = fieldModels[viewInfo.key];
					const fieldType = fieldModel ? fieldModel.type : undefined;
					if (!_checkFieldType(fieldType, usesRangeLegend)) {
						return;
					}
					viewModel.type = 'FIELD_' + fieldType;
					viewModel.subType = undefined;
					viewModel.values = fieldModel.values;
					viewModel.value = viewInfo.key;
					viewModel.label = lx.translateField(factsheetType, viewInfo.key);
					break;
				case 'TAG':
					// format: 'tags.<TAG_GROUP_ID>'
					const tagGroupID = viewInfo.key.slice(5);
					if (!_checkTagGroup(tagGroupID, tagGroups)) {
						return;
					}
					viewModel.type = viewInfo.type;
					viewModel.subType = undefined;
					viewModel.values = tagGroups[tagGroupID].tags.nodes;
					viewModel.value = tagGroupID;
					viewModel.label = 'Tag group: ' + viewInfo.label;
					break;
				case 'FIELD_RELATION':
					// format: '<RELATION>.<RELATION_FIELD>'
					const relFieldValue = viewInfo.key.split('.');
					const relFRModel = ReportSetupUtilities.getRelationModel(setup, relFieldValue[0]);
					const relFRFieldModel = Utilities.getFrom(relFRModel, 'fields.' + relFieldValue[1]);
					if (!_checkRelField(relFieldValue, relFRFieldModel.type, usesRangeLegend)) {
						return;
					}
					viewModel.type = viewInfo.type;
					viewModel.subType = 'FIELD_' + relFRFieldModel.type;
					viewModel.values = usesRangeLegend ? undefined : relFRFieldModel.values;
					viewModel.value = relFieldValue;
					// TODO see https://github.com/leanix/leanix-reporting/issues/11
					viewModel.label = lx.translateRelation(relFieldValue[0]) + ': ' + relFieldValue[1];
					break;
				case 'FIELD_TARGET_FS':
					// format: '<RELATION>.<FACTSHEET_TYPE>.<FACTSHEET_FIELD>'
					const relTargetValue = viewInfo.key.split('.');
					const relFTModel = ReportSetupUtilities.getRelationModel(setup, relTargetValue[0]);
					const linkedFactsheetFieldModel = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + relTargetValue[1] + '.fields.' + relTargetValue[2]);
					if (!_checkTargetValue(relTargetValue, relFTModel, factsheetTypes, linkedFactsheetFieldModel.type, usesRangeLegend)) {
						return;
					}
					viewModel.type = viewInfo.type;
					viewModel.subType = 'FIELD_' + linkedFactsheetFieldModel.type;
					viewModel.values = usesRangeLegend ? undefined : linkedFactsheetFieldModel.values;
					viewModel.value = relTargetValue;
					viewModel.label = lx.translateRelation(relTargetValue[0]) + ': ' + lx.translateField(relTargetValue[1], relTargetValue[2]);
					break;
				case 'BUILT_IN':
					// the 'built in' stuff is specific for leanix itself,
					// not relevant for the report
					return;
				default:
					console.error('Unknown viewInfo type "' + viewInfo.type + '".');
					return;
			}
			viewModels.views.push(viewModel);
		});
		// TODO add multiple-selectable tag groups to viewModels
		viewModels.views.sort((f, s) => {
			const fSortID = _getTypeSortID(f.type);
			const sSortID = _getTypeSortID(s.type);
			if (fSortID === sSortID) {
				return f.label.localeCompare(s.label);
			}
			return fSortID - sSortID;
		});
		// add models for the axes
		// TODO view can't deal with multi-select models
		viewModels.xAxis = viewModels.views.filter(_filterViewModelsForAxis);
		viewModels.yAxis = viewModels.views.filter(_filterViewModelsForAxis);
		// only include those that have more than 1 view model
		if (viewModels.views.length > 1 && viewModels.xAxis.length > 1 && viewModels.yAxis.length > 1) {
			viewModelsPerFactsheet[factsheetType] = viewModels;
		}
	});
	return viewModelsPerFactsheet;
}

function _filterViewModelsForAxis(viewModel) {
	return !viewModel.rangeLegend || viewModel.values !== undefined;
}

function _getTypeSortID(type) {
	switch (type) {
		// field types range 0-99
		case 'FIELD_LIFECYCLE':
			return 0;
		case 'FIELD_PROJECT_STATUS':
			return 1;
		case 'FIELD_SINGLE_SELECT':
			return 2;
		case 'FIELD_DOUBLE':
			return 3;
		case 'FIELD_INTEGER':
			return 4;
		case 'FIELD_LONG':
			return 5;
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

function _checkFieldType(type, usesRangeLegend) {
	if (!type) {
		return false;
	}
	if (usesRangeLegend) {
		return type === 'DOUBLE' || type === 'INTEGER' || type === 'LONG';
	}
	switch (type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
		case 'SINGLE_SELECT':
		//case 'MULTIPLE_SELECT': --> not supported as view by leanix, report has to do it, worth it?
			return true;
		default:
			console.error('_checkFieldType: Unknown type "' + type + '".');
			return false;
	}
}

function _checkTagGroup(id, tagGroups) {
	const tagGroup = tagGroups[id];
	// filter out multi-selectable tags here, b/c the report will add them later
	// leanix doesn't support multi-select tag groups anyway
	return tagGroup && tagGroup.mode !== 'MULTIPLE' && tagGroup.tags; // 'tags' is a subIndex
}

function _checkRelField(value, fieldType, usesRangeLegend) {
	if (value.length !== 2) {
		// expected format didn't match, which need to be fixed by a developer
		return false;
	}
	return _checkFieldType(fieldType, usesRangeLegend);
}

function _checkTargetValue(value, relModel, factsheetTypes, fieldType, usesRangeLegend) {
	if (value.length !== 3) {
		// expected format didn't match, which need to be fixed by a developer
		return false;
	}
	if (!relModel) {
		return false;
	}
	if (!factsheetTypes.includes(value[1])) {
		return false;
	}
	return _checkFieldType(fieldType, usesRangeLegend);
}

function getQueryAttribute(viewModel) {
	const value = viewModel.value;
	switch (viewModel.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
			return value + ' { asString }';
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
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
			return 'tags { id }';
		default:
			console.error('getQueryAttribute: Unknown type "' + viewModel.type + '" of data field "' + value + '".');
			return value;
	}
}

function create(setup, factsheetType, viewModels, data) {
	const matrix = _createMatrixGrid(factsheetType, viewModels.xAxis, viewModels.yAxis);
	// now add the data
	let matrixDataAvailable = false;
	const missingData = [];
	data.nodes.forEach((e) => {
		const id = e.id;
		const additionalData = data.additionalNodeData[id];
		// get data values
		const xDataValues = _getDataValues(viewModels.xAxis, additionalData, data.tagGroups);
		const yDataValues = _getDataValues(viewModels.yAxis, additionalData, data.tagGroups);
		if (!xDataValues || !yDataValues) {
			// TODO
			return;
		}
		// determine the coordinates
		const xCoordinates = _getCoordinates(viewModels.xAxis, xDataValues);
		const yCoordinates = _getCoordinates(viewModels.yAxis, yDataValues);
		if (xCoordinates.length === 0 || yCoordinates.length === 0) {
			// TODO
			return;
		}
		// determine view model for the label
		// TODO data.legendItems[ data.legendMapping[ id ] ]
		// now fill the matrix
		matrixDataAvailable = true;
		yCoordinates.forEach((y) => {
			xCoordinates.forEach((x) => {
				matrix[y][x].push({
					id: id,
					name: e.displayName,
					colors: undefined
				});
			});
		});
	});
	return {
		matrixData: matrix,
		matrixDataAvailable: matrixDataAvailable,
		missingData: missingData,
		legendData: _createLegendData(factsheetType, viewModels.view, data.legendItems._rawLegendItems)
	};
}

function _getCoordinates(viewModel, dataValues) {
	// +1 since 0 positions are reserved in the matrix
	switch (viewModel.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
		case 'FIELD_RELATION':
		case 'FIELD_TARGET_FS':
			return dataValues.map((dataValue) => {
				return viewModel.values.findIndex((viewModelValue) => {
					return dataValue === viewModelValue;
				}) + 1;
			}).filter((e) => {
				return e > 0;
			});
		case 'TAG':
			return dataValues.map((dataValue) => {
				return viewModel.values.findIndex((viewModelValue) => {
					return dataValue.id === viewModelValue.id;
				}) + 1;
			}).filter((e) => {
				return e > 0;
			});
		default:
			console.error('_getCoordinates: Unknown type "' + viewModel.type + '" of data field "' + viewModel.value + '".');
			return;
	}
}

function _getDataValues(viewModel, additionalData, tagGroups) {
	const value = viewModel.value;
	let dataValues = undefined;
	switch (viewModel.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
			dataValues = additionalData[value];
			if (dataValues === undefined || dataValues === null) {
				break;
			}
			dataValues = [dataValues.asString];
			break;
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
			dataValues = additionalData[value];
			if (dataValues === undefined || dataValues === null) {
				break;
			}
			dataValues = [dataValues];
			break;
		case 'FIELD_RELATION':
			const frSubIndex = additionalData[value[0]];
			if (!frSubIndex) {
				return;
			}
			dataValues = [];
			frSubIndex.nodes.forEach((rel) => {
				const v = rel[value[1]];
				if (v === undefined || v === null) {
					return;
				}
				dataValues.push(v);
			});
			break;
		case 'FIELD_TARGET_FS':
			const ftSubIndex = additionalData[value[0]];
			if (!ftSubIndex) {
				return;
			}
			dataValues = [];
			ftSubIndex.nodes.forEach((rel) => {
				const v = rel.factsheet[value[2]];
				if (v === undefined || v === null) {
					return;
				}
				dataValues.push(v);
			});
			break;
		case 'TAG':
			const tagGroupTags = viewModel.values;
			const tags = additionalData.tags;
			if (tags.length === 0) {
				break;
			}
			dataValues = [];
			tags.forEach((tag) => {
				const t = tagGroupTags.find((e) => {
					return e.id === tag.id;
				});
				if (t) {
					dataValues.push(t);
				}
			});
			break;
		default:
			console.error('_getDataValue: Unknown type "' + viewModel.type + '" of data field "' + value + '".');
			break;
	}
	dataValues = Utilities.unique(dataValues);
	return !dataValues || dataValues.length === 0 ? undefined : dataValues;
}

function _createMatrixGrid(factsheetType, xAxisModel, yAxisModel) {
	if (xAxisModel.rangeLegend || yAxisModel.rangeLegend) {
		// should not happens, since range-based view models are not allowed for axes
		console.error('_createMatrixGrid: can\'t create the matrix with "' + xAxisModel + ' & ' + yAxisModel + '".');
		return;
	}
	const result = []; // position (0,0) will always be empty
	// the first row contains the values from the x axis model
	const xAxisValues = xAxisModel.values;
	result.push([undefined].concat(xAxisValues.map((e) => {
		return _getLabelFunc(factsheetType, xAxisModel, e)();
	})));
	// all other rows contain the values from the y axis option as their first value
	const yAxisValues = yAxisModel.values;
	yAxisValues.forEach((e) => {
		// extend the row with empty arrays for later use
		result.push([_getLabelFunc(factsheetType, yAxisModel, e)()].concat(xAxisValues.map(() => {
			return [];
		})));
	});
	return result;
}

function _createLegendData(factsheetType, viewModel, legendItemData) {
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
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
		case 'FIELD_SINGLE_SELECT':
			return () => {
				return lx.translateFieldValue(factsheetType, value, fallbackValue);
			};
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
			// should not happen, b/c these types are for relation fields only
			console.error('_getLabelFunc: can\'t create the label function for "' + xAxisModel.type + '".');
			return;
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
				return fallbackValue.name;
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