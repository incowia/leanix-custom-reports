import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';

function createAxisModels(setup, factsheetTypes, tagGroups) {
	/*
		values that can be used for axis:
			- factsheet fields
			- factsheet relation
				- fields
				- target factsheet fields (only if "to.factSheetType" is not "*")
			- tag groups
		field types that can be used:
			- LIFECYCLE
			- PROJECT_STATUS
			- SINGLE_SELECT
			- MULTIPLE_SELECT
	*/
	const factsheetTypeModels = {};
	factsheetTypes.forEach((factsheetType) => {
		const fieldModels = ReportSetupUtilities.getFactsheetFieldModels(setup, factsheetType);
		const relNames = ReportSetupUtilities.getFactsheetRelationNames(setup, factsheetType);
		let models = [];
		const addToModels = (axisModel) => {
			models.push(axisModel);
		};
		// factsheet fields
		_getAxisModelsFromFields(factsheetType, fieldModels).forEach(addToModels);
		// factsheet relation fields & target factsheet fields
		relNames.forEach((relName) => {
			const relModel = ReportSetupUtilities.getRelationModel(setup, relName);
			// factsheet relation fields
			_getAxisModelsFromRelationFields(relName, relModel.fields).forEach(addToModels);
			// factsheet relation target factsheet fields
			// the target type is always the opposite of "from/to"'s name match
			const targetFactsheetType = relModel.from.name === relName ? relModel.to.factSheetType : relModel.from.factSheetType;
			if (targetFactsheetType === '*') {
				return;
			}
			const targetFactsheetFieldModels = ReportSetupUtilities.getFactsheetFieldModels(setup, targetFactsheetType);
			_getAxisModelsFromRelationTargetFactsheetFields(relName, targetFactsheetType, targetFactsheetFieldModels).forEach(addToModels);
		});
		// tag groups
		_getAxisModelsFromTagGroups(factsheetType, tagGroups).forEach(addToModels);
		// post tasks: uniqueness & sorting
		models = Utilities.unique(models, (model) => {
			return model.key;
		});
		models.sort((f, s) => {
			const fSortID = _getTypeSortID(f.type);
			const sSortID = _getTypeSortID(s.type);
			if (fSortID === sSortID) {
				return f.label.localeCompare(s.label);
			}
			return fSortID - sSortID;
		});
		// only include factsheets that have more than 1 axis models
		if (models.length > 1) {
			factsheetTypeModels[factsheetType] = models;
		}
	});
	return factsheetTypeModels;
}

function _getTypeSortID(type) {
	switch (type) {
		case 'FIELD_LIFECYCLE':
			return 0;
		case 'FIELD_PROJECT_STATUS':
			return 1;
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_MULTIPLE_SELECT':
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

function _getAxisModelsFromTagGroups(factsheetType, tagGroups) {
	const result = [];
	for (let tagGroupID in tagGroups) {
		const tagGroup = tagGroups[tagGroupID];
		if (!tagGroup.tags) { // 'tags' is a subIndex
			continue;
		}
		if (tagGroup.restrictToFactSheetTypes && tagGroup.restrictToFactSheetTypes.length > 0) {
			if (!tagGroup.restrictToFactSheetTypes.includes(factsheetType)) {
				continue;
			}
		}
		result.push({
			key: 'tags.' + tagGroupID,
			label: 'Tag group: ' + tagGroup.name,
			type: 'TAG',
			subType: null,
			valuePath: tagGroupID,
			values: tagGroup.tags.nodes
		});
	}
	return result;
}

function _getAxisModelsFromRelationTargetFactsheetFields(relName, factsheetType, fieldModels) {
	const result = [];
	for (let fieldName in fieldModels) {
		const fieldModel = fieldModels[fieldName];
		if (!_checkFieldModel(fieldModel)) {
			continue;
		}
		result.push({
			key: relName + '.' + factsheetType + '.' + fieldName,
			label: lx.translateRelation(relName) + ': ' + lx.translateField(factsheetType, fieldName),
			type: 'FIELD_TARGET_FS',
			subType: 'FIELD_' + fieldModel.type,
			valuePath: [relName, factsheetType, fieldName],
			values: fieldModel.values
		});
	}
	return result;
}

function _getAxisModelsFromRelationFields(relName, fieldModels) {
	const result = [];
	for (let fieldName in fieldModels) {
		const fieldModel = fieldModels[fieldName];
		if (!_checkFieldModel(fieldModel)) {
			continue;
		}
		result.push({
			key: relName + '.' + fieldName,
			// TODO see https://github.com/leanix/leanix-reporting/issues/11
			label: lx.translateRelation(relName) + ': ' + fieldName,
			type: 'FIELD_RELATION',
			subType: 'FIELD_' + fieldModel.type,
			valuePath: [relName, fieldName],
			values: fieldModel.values
		});
	}
	return result;
}

function _getAxisModelsFromFields(factsheetType, fieldModels) {
	const result = [];
	for (let fieldName in fieldModels) {
		const fieldModel = fieldModels[fieldName];
		if (!_checkFieldModel(fieldModel)) {
			continue;
		}
		result.push({
			key: fieldName,
			label: lx.translateField(factsheetType, fieldName),
			type: 'FIELD_' + fieldModel.type,
			subType: null,
			valuePath: fieldName,
			values: fieldModel.values
		});
	}
	return result;
}

function _checkFieldModel(fieldModel) {
	switch (fieldModel.type) {
		case 'LIFECYCLE':
		case 'PROJECT_STATUS':
		case 'SINGLE_SELECT':
		case 'MULTIPLE_SELECT':
			return true;
		default:
			return false;
	}
}

function getViewInfoCounts(factsheetTypes, allViewInfos) {
	const result = {};
	factsheetTypes.forEach((factsheetType) => {
		const viewInfos = allViewInfos[factsheetType].viewInfos;
		result[factsheetType] = viewInfos ? viewInfos.length : 0;
	});
	return result;
}

function getQueryAttribute(model) {
	const value = model.valuePath;
	switch (model.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
			return value + ' { asString }';
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_MULTIPLE_SELECT':
			return value;
		case 'FIELD_RELATION':
			const subRelFieldModel = {
				valuePath: value[1],
				type: model.subType
			};
			return value[0] + '{ edges { node { ' + getQueryAttribute(subRelFieldModel) + ' } } }';
		case 'FIELD_TARGET_FS':
			const subRelTargetModel = {
				valuePath: value[2],
				type: model.subType
			};
			return value[0] + '{ edges { node { factSheet { ... on ' + value[1] + ' { ' + getQueryAttribute(subRelTargetModel) + ' } } } } }';
		case 'TAG':
			return 'tags { id }';
		default:
			console.error('getQueryAttribute: Unknown type "' + model.type + '" of data field "' + value + '".');
			return value;
	}
}

function createViewModel(viewData) {
	const result = {
		label: viewData.label,
		legendItems: {},
		legendMapping: {}
	};
	const legendItems = viewData.legendItems;
	const mapping = viewData.mapping;
	viewData.legendItems.forEach((legendItem) => {
		result.legendItems[legendItem.id] = legendItem;
	});
	viewData.mapping.forEach((mapping) => {
		result.legendMapping[mapping.fsId] = mapping.legendId;
	});
	return result;
}

function create(factsheetType, models, data) {
	const matrix = _createMatrixGrid(factsheetType, models.xAxis, models.yAxis);
	// now add the data
	let matrixDataAvailable = false;
	const missingData = [];
	data.nodes.forEach((node) => {
		const id = node.id;
		const additionalData = data.additionalNodeData[id];
		// get data values
		const xDataValues = _getDataValues(models.xAxis, additionalData, data.tagGroups);
		const yDataValues = _getDataValues(models.yAxis, additionalData, data.tagGroups);
		if (!xDataValues || !yDataValues) {
			missingData.push({
				id: id,
				name: node.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForValues(xDataValues, yDataValues,
					models.xAxis.label, models.yAxis.label)
			});
			return;
		}
		// determine the coordinates
		const xCoordinates = _getCoordinates(models.xAxis, xDataValues);
		const yCoordinates = _getCoordinates(models.yAxis, yDataValues);
		if (xCoordinates.length === 0 || yCoordinates.length === 0) {
			missingData.push({
				id: id,
				name: node.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForCoordinates(xCoordinates, yCoordinates,
					xDataValues, yDataValues,
					models.xAxis.label, models.yAxis.label)
			});
			return;
		}
		// determine view model for the label
		const legendItemID = models.view.legendMapping[id];
		const legendItem = legendItemID !== undefined && legendItemID !== null ? models.view.legendItems[legendItemID] : undefined;
		const hidden = legendItem ? legendItem.value === 'HIDDEN_IN_MATRIX' : false;
		const colors = !hidden ? {
				legendItemID: legendItemID,
				color: legendItem.color,
				bgColor: legendItem.bgColor,
				transparency: legendItem.transparency
			} : undefined;
		if (!colors) {
			missingData.push({
				id: id,
				name: node.displayName,
				type: factsheetType,
				reason: _createMissingDataMsgForVM(models.view.label, hidden)
			});
			return;
		}
		// now fill the matrix
		matrixDataAvailable = true;
		yCoordinates.forEach((y) => {
			xCoordinates.forEach((x) => {
				matrix[y][x].push({
					id: id,
					name: node.displayName,
					colors: colors
				});
			});
		});
	});
	return {
		matrix: matrix,
		matrixDataAvailable: matrixDataAvailable,
		missing: missingData
	};
}

function _createMissingDataMsgForValues(xDataValues, yDataValues, xAxisName, yAxisName) {
	if (!xDataValues && !yDataValues) {
		return 'Values for "' + xAxisName + '" & "' + yAxisName + '" are missing.';
	}
	if (!xDataValues) {
		return 'Value for "' + xAxisName + '" is missing.';
	} else {
		return 'Value for "' + yAxisName + '" is missing.';
	}
}

function _createMissingDataMsgForCoordinates(xCoordinates, yCoordinates, xDataValues, yDataValues, xAxisName, yAxisName) {
	if (xCoordinates.length === 0 && yCoordinates.length === 0) {
		return 'Unknown values for "' + xAxisName + '" (' + xDataValues.join(', ') + ') & "'
			+ yAxisName + '" (' + yDataValues.join(', ') + ').';
	}
	if (xCoordinates.length === 0) {
		return 'Unknown values for "' + xAxisName + '" (' + xDataValues.join(', ') + ').';
	} else {
		return 'Unknown values for "' + yAxisName + '" (' + yDataValues.join(', ') + ').';
	}
}

function _createMissingDataMsgForVM(viewLabel, hidden) {
	if (hidden) {
		return 'Value for view is marked as hidden.';
	}
	return 'There are no values defined for the selected view (' + viewLabel + ').';
}

function _getCoordinates(model, dataValues) {
	// +1 since 0 positions are reserved in the matrix
	switch (model.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_MULTIPLE_SELECT':
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
			console.error('_getCoordinates: Unknown type "' + model.type + '" of data field "' + model.valuePath + '".');
			return;
	}
}

function _getDataValues(model, additionalData, tagGroups) {
	const value = model.valuePath;
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
		case 'FIELD_MULTIPLE_SELECT':
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
	const result = [];
	// the first row contains the values from the x axis model
	const xAxisValues = xAxisModel.values;
	result.push([[xAxisModel.label, yAxisModel.label]].concat(xAxisValues.map((e) => {
		return _getLabel(factsheetType, xAxisModel, e);
	})));
	// all other rows contain the values from the y axis option as their first value (meaning: the first column)
	const yAxisValues = yAxisModel.values;
	yAxisValues.forEach((e) => {
		// extend the row with empty arrays for later use
		result.push([_getLabel(factsheetType, yAxisModel, e)].concat(xAxisValues.map(() => {
			return [];
		})));
	});
	return result;
}

function _getLabel(factsheetType, model, fallbackValue) {
	if (fallbackValue === '__missing__') {
		// TODO see https://github.com/leanix/leanix-reporting/issues/7
		return 'n/a';
	}
	const value = model.valuePath;
	switch (model.type) {
		case 'FIELD_LIFECYCLE':
		case 'FIELD_PROJECT_STATUS':
		case 'FIELD_SINGLE_SELECT':
		case 'FIELD_MULTIPLE_SELECT':
			return lx.translateFieldValue(factsheetType, value, fallbackValue);
		case 'FIELD_RELATION':
			// TODO see https://github.com/leanix/leanix-reporting/issues/11
			return fallbackValue;
		case 'FIELD_TARGET_FS':
			return lx.translateFieldValue(value[1], value[2], fallbackValue);
		case 'TAG':
			return fallbackValue.name ? fallbackValue.name : fallbackValue;
		default:
			console.error('_getLabel: Unknown type "' + model.type + '" of data field "' + value + '".');
			return '';
	}
}

export default {
	createAxisModels: createAxisModels,
	getViewInfoCounts: getViewInfoCounts,
	getQueryAttribute: getQueryAttribute,
	createViewModel: createViewModel,
	create: create
};