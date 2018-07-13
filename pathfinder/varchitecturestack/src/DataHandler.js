import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';

function createModels(setup, factsheetTypes, allViewInfos, tagGroups) {
	const viewModelsPerFactsheet = {};
	factsheetTypes.forEach((factsheetType) => {
		const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + factsheetType + '.fields');
		const models = [];
		allViewInfos[factsheetType].viewInfos.forEach((viewInfo) => {
			const usesRangeLegend = viewInfo.viewOptionSupport ? viewInfo.viewOptionSupport.usesRangeLegend : false;
			const model = {
				key: viewInfo.key,
				rangeLegend: usesRangeLegend,
				multiSelect: false // mutli-select viewInfos are not supported by leanix
			};
			switch (viewInfo.type) {
				case 'FIELD':
					const fieldModel = fieldModels[viewInfo.key];
					const fieldType = fieldModel ? fieldModel.type : undefined;
					if (!_checkFieldType(fieldType, usesRangeLegend)) {
						return;
					}
					model.type = 'FIELD_' + fieldType;
					model.subType = undefined;
					model.values = fieldModel.values;
					model.value = viewInfo.key;
					model.label = lx.translateField(factsheetType, viewInfo.key);
					break;
				case 'TAG':
					// format: 'tags.<TAG_GROUP_ID>'
					const tagGroupID = viewInfo.key.slice(5);
					if (!_checkTagGroup(tagGroupID, tagGroups)) {
						return;
					}
					model.type = viewInfo.type;
					model.subType = undefined;
					model.values = tagGroups[tagGroupID].tags.nodes;
					model.value = tagGroupID;
					model.label = 'Tag group: ' + viewInfo.label;
					break;
				case 'FIELD_RELATION':
					// format: '<RELATION>.<RELATION_FIELD>'
					const relFieldValue = viewInfo.key.split('.');
					const relFRModel = ReportSetupUtilities.getRelationModel(setup, relFieldValue[0]);
					const relFRFieldModel = Utilities.getFrom(relFRModel, 'fields.' + relFieldValue[1]);
					if (!_checkRelField(relFieldValue, relFRFieldModel.type, usesRangeLegend)) {
						return;
					}
					model.type = viewInfo.type;
					model.subType = 'FIELD_' + relFRFieldModel.type;
					model.values = usesRangeLegend ? undefined : relFRFieldModel.values;
					model.value = relFieldValue;
					// TODO see https://github.com/leanix/leanix-reporting/issues/11
					model.label = lx.translateRelation(relFieldValue[0]) + ': ' + relFieldValue[1];
					break;
				case 'FIELD_TARGET_FS':
					// format: '<RELATION>.<FACTSHEET_TYPE>.<FACTSHEET_FIELD>'
					const relTargetValue = viewInfo.key.split('.');
					const relFTModel = ReportSetupUtilities.getRelationModel(setup, relTargetValue[0]);
					const linkedFactsheetFieldModel = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + relTargetValue[1] + '.fields.' + relTargetValue[2]);
					if (!_checkTargetValue(relTargetValue, relFTModel, factsheetTypes, linkedFactsheetFieldModel.type, usesRangeLegend)) {
						return;
					}
					model.type = viewInfo.type;
					model.subType = 'FIELD_' + linkedFactsheetFieldModel.type;
					model.values = usesRangeLegend ? undefined : linkedFactsheetFieldModel.values;
					model.value = relTargetValue;
					model.label = lx.translateRelation(relTargetValue[0]) + ': ' + lx.translateField(relTargetValue[1], relTargetValue[2]);
					break;
				case 'BUILT_IN':
					// the 'built in' stuff is specific for leanix itself,
					// not relevant for the report
					return;
				default:
					console.error('Unknown viewInfo type "' + viewInfo.type + '".');
					return;
			}
			models.push(model);
		});
		// add multi-select tag groups to models
		for (let tagGroupID in tagGroups) {
			const tagGroup = tagGroups[tagGroupID];
			if (tagGroup.mode !== 'MULTIPLE'
				|| (tagGroup.restrictToFactSheetTypes.length > 0 ? !tagGroup.restrictToFactSheetTypes.includes(factsheetType) : false)) {
				continue;
			}
			const tags = tagGroup.tags;
			if (!tags) {
				continue;
			}
			models.push({
				key: 'tags.' + tagGroupID,
				rangeLegend: false,
				type: 'TAG',
				subType: undefined,
				values: tags.nodes,
				value: tagGroupID,
				label: 'Tag group: ' + tagGroup.name,
				multiSelect: true
			});
		}
		models.sort((f, s) => {
			const fSortID = _getTypeSortID(f.type);
			const sSortID = _getTypeSortID(s.type);
			if (fSortID === sSortID) {
				return f.label.localeCompare(s.label);
			}
			return fSortID - sSortID;
		});
		// create models for view & axes
		const viewModels = models.filter((model) => {
			// view can't deal with multi-select models
			return !model.multiSelect;
		});
		const xAxisModels = models.filter((model) => {
			// there is no standardised expression for range-based models,
			// therefore they can't be used for axes, also we need 'values'
			return !model.rangeLegend || model.values !== undefined;
		});
		const yAxisModels = Utilities.copyArray(xAxisModels);
		// only include those that have more than 1 model
		if (viewModels.length > 1 && xAxisModels.length > 1 && yAxisModels.length > 1) {
			viewModelsPerFactsheet[factsheetType] = {
				views: viewModels,
				xAxis: xAxisModels,
				yAxis: yAxisModels
			};
		}
	});
	return viewModelsPerFactsheet;
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
	// filter out multi-selectable tag groups here, b/c the report will add them later,
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

function getQueryAttribute(model) {
	const value = model.value;
	switch (model.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
			return value + ' { asString }';
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
			return value;
		case 'FIELD_RELATION':
			if (model.rangeLegend) {
				return value[0] + '{ edges { node { ' + value[1] + ' } } }';
			}
			const subRelFieldViewModel = {
				value: value[1],
				type: model.subType
			};
			return value[0] + '{ edges { node { ' + getQueryAttribute(subRelFieldViewModel) + ' } } }';
		case 'FIELD_TARGET_FS':
			if (model.rangeLegend) {
				return value[0] + '{ edges { node { factSheet { ... on ' + value[1] + ' { ' + value[2] + ' } } } } }';
			}
			const subRelTargetViewModel = {
				value: value[2],
				type: model.subType
			};
			return value[0] + '{ edges { node { factSheet { ... on ' + value[1] + ' { ' + getQueryAttribute(subRelTargetViewModel) + ' } } } } }';
		case 'TAG':
			return 'tags { id }';
		default:
			console.error('getQueryAttribute: Unknown type "' + model.type + '" of data field "' + value + '".');
			return value;
	}
}

function create(setup, factsheetType, models, data) {
	const matrix = _createMatrixGrid(factsheetType, models.xAxis, models.yAxis);
	// now add the data
	let matrixDataAvailable = false;
	const missingData = [];
	data.nodes.forEach((e) => {
		const id = e.id;
		const additionalData = data.additionalNodeData[id];
		// get data values
		const xDataValues = _getDataValues(models.xAxis, additionalData, data.tagGroups);
		const yDataValues = _getDataValues(models.yAxis, additionalData, data.tagGroups);
		if (!xDataValues || !yDataValues) {
			missingData.push({
				id: e.id,
				name: e.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForValues(xDataValues, yDataValues, models.xAxis.label, models.yAxis.label)
			});
			return;
		}
		// determine the coordinates
		const xCoordinates = _getCoordinates(models.xAxis, xDataValues);
		const yCoordinates = _getCoordinates(models.yAxis, yDataValues);
		if (xCoordinates.length === 0 || yCoordinates.length === 0) {
			missingData.push({
				id: e.id,
				name: e.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForCoordinates(xCoordinates, yCoordinates, xDataValues, yDataValues, models.xAxis.label, models.yAxis.label)
			});
			return;
		}
		// determine view model for the label
		const legendItemID = data.legendMapping[id];
		const legendItem = legendItemID !== undefined && legendItemID !== null ? data.legendItems[legendItemID] : undefined;
		const colors = legendItem ? {
				legendItemID: legendItemID,
				color: legendItem.color,
				bgColor: legendItem.bgColor
			} : undefined;
		if (!colors || !legendItem.inLegend) {
			missingData.push({
				id: e.id,
				name: e.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForVM(models.view, legendItem ? legendItem.inLegend : true)
			});
			return;
		}
		// now fill the matrix
		matrixDataAvailable = true;
		yCoordinates.forEach((y) => {
			xCoordinates.forEach((x) => {
				matrix[y][x].push({
					id: id,
					name: e.displayName,
					colors: colors
				});
			});
		});
	});
	return {
		matrix: matrix,
		matrixDataAvailable: matrixDataAvailable,
		missing: missingData,
		legend: _createLegendData(factsheetType, models.view, data.legendItems._rawLegendItems)
	};
}

function _createMissingDataMsgForValues(xDataValues, yDataValues, xAxisName, yAxisName) {
	if (!xDataValues && !yDataValues) {
		return 'Values for ' + xAxisName + ' & ' + yAxisName + ' are missing.';
	}
	if (!xDataValues) {
		return 'Value for ' + xAxisName + ' is missing.';
	} else {
		return 'Value for ' + yAxisName + ' is missing.';
	}
}

function _createMissingDataMsgForCoordinates(xCoordinates, yCoordinates, xDataValues, yDataValues, xAxisName, yAxisName) {
	if (xCoordinates.length === 0 && yCoordinates.length === 0) {
		return 'Unknown values for ' + xAxisName + ' (' + xDataValues.join(', ') + ') & '
			+ yAxisName + ' (' + yDataValues.join(', ') + ').';
	}
	if (xCoordinates.length === 0) {
		return 'Unknown values for ' + xAxisName + ' (' + xDataValues.join(', ') + ').';
	} else {
		return 'Unknown values for ' + yAxisName + ' (' + yDataValues.join(', ') + ').';
	}
}

function _createMissingDataMsgForVM(model, inLegend) {
	if (!inLegend) {
		return 'Value for view is marked as hidden.';
	}
	return 'There are no values defined for the selected view (' + model.label + ').';
}

function _getCoordinates(model, dataValues) {
	// +1 since 0 positions are reserved in the matrix
	switch (model.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_DOUBLE':
		case 'FIELD_INTEGER':
		case 'FIELD_LONG':
		case 'FIELD_RELATION':
		case 'FIELD_TARGET_FS':
			return dataValues.map((dataValue) => {
				return model.values.findIndex((viewModelValue) => {
					return dataValue === viewModelValue;
				}) + 1;
			}).filter((e) => {
				return e > 0;
			});
		case 'TAG':
			return dataValues.map((dataValue) => {
				return model.values.findIndex((viewModelValue) => {
					return dataValue.id === viewModelValue.id;
				}) + 1;
			}).filter((e) => {
				return e > 0;
			});
		default:
			console.error('_getCoordinates: Unknown type "' + model.type + '" of data field "' + model.value + '".');
			return;
	}
}

function _getDataValues(model, additionalData, tagGroups) {
	const value = model.value;
	let dataValues = undefined;
	switch (model.type) {
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
			const tagGroupTags = model.values;
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
			console.error('_getDataValue: Unknown type "' + model.type + '" of data field "' + value + '".');
			break;
	}
	dataValues = Utilities.unique(dataValues);
	return !dataValues || dataValues.length === 0 ? undefined : dataValues;
}

function _createMatrixGrid(factsheetType, xAxisModel, yAxisModel) {
	if (xAxisModel.rangeLegend || yAxisModel.rangeLegend) {
		// should not happens, since range-based models are not allowed for axes
		console.error('_createMatrixGrid: can\'t create the matrix with "' + xAxisModel + ' & ' + yAxisModel + '".');
		return;
	}
	const result = [];
	// the first row contains the values from the x axis model
	const xAxisValues = xAxisModel.values;
	result.push([[yAxisModel.label, xAxisModel.label]].concat(xAxisValues.map((e) => {
		return _getLabelFunc(factsheetType, xAxisModel, e)();
	})));
	// all other rows contain the values from the y axis option as their first value (meaning: the first column)
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

function _getLabelFunc(factsheetType, model, fallbackValue) {
	if (fallbackValue === '__missing__') {
		// TODO see https://github.com/leanix/leanix-reporting/issues/7
		return () => {
			return 'n/a';
		};
	}
	if (model.rangeLegend) {
		return () => {
			return fallbackValue;
		};
	}
	const value = model.value;
	switch (model.type) {
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
			if (fallbackValue.name) {
				return () => {
					return fallbackValue.name;
				};
			} else {
				return () => {
					return fallbackValue;
				};
			}
		default:
			console.error('_getLabelFunc: Unknown type "' + model.type + '" of data field "' + value + '".');
			return () => {
				return '';
			};
	}
}

export default {
	createModels: createModels,
	getQueryAttribute: getQueryAttribute,
	create: create
};