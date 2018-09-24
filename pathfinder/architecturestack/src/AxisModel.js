function _create(key, label, type, subType, valuePath, values) {
	return {
		key: key,
		label: label,
		type: type,
		subType: subType,
		valuePath: valuePath,
		values: values
	};
}

function createForTag(tagGroupID, tagGroupName, tags) {
	return _create('tags.' + tagGroupID,
		'Tag group: ' + tagGroupName,
		'TAG',
		null,
		tagGroupID,
		tags);
}

function createForRelationTargetFactsheetField(relName, factsheetType, fieldName, fieldType, fieldValues) {
	return _create(relName + '.' + factsheetType + '.' + fieldName,
		lx.translateRelation(relName) + ': ' + lx.translateField(factsheetType, fieldName),
		'FIELD_TARGET_FS',
		'FIELD_' + fieldType,
		[relName, factsheetType, fieldName],
		fieldValues);
}

function createForRelationField(relName, fieldName, fieldType, fieldValues) {
	return _create(relName + '.' + fieldName,
		// TODO see https://github.com/leanix/leanix-reporting/issues/11
		lx.translateRelation(relName) + ': ' + fieldName,
		'FIELD_RELATION',
		'FIELD_' + fieldType,
		[relName, fieldName],
		fieldValues);
}

function createForField(factsheetType, fieldName, fieldType, fieldValues) {
	return _create(fieldName,
		lx.translateField(factsheetType, fieldName),
		'FIELD_' + fieldType,
		null,
		fieldName,
		fieldValues);
}

function sortAxisModels(f, s) {
	const fSortID = _getTypeSortID(f.type);
	const sSortID = _getTypeSortID(s.type);
	if (fSortID === sSortID) {
		return f.label.localeCompare(s.label);
	}
	return fSortID - sSortID;
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

export default {
	createForTag: createForTag,
	createForRelationTargetFactsheetField: createForRelationTargetFactsheetField,
	createForRelationField: createForRelationField,
	createForField: createForField,
	sortAxisModels: sortAxisModels
};