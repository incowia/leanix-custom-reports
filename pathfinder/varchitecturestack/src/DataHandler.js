import Utilities from './common/leanix-reporting-utilities/Utilities';
import ReportSetupUtilities from './common/leanix-reporting-utilities/ReportSetupUtilities';
import Constants from './Constants';

function createViewModels(setup, allViewInfos, tagGroups) {
	const viewModelsPerFactsheet = {};
	for (let factsheetType in allViewInfos) {
		const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + factsheetType + '.fields');
		const viewInfos = allViewInfos[factsheetType].viewInfos.filter((e) => {
			switch (e.type) {
				case 'FIELD':
					return _checkFieldType(fieldModels[e.key].type);
				case 'TAG':
					// format: 'tags.<TAG_GROUP_ID>'
					return _checkTagGroup(e.key.slice(5), tagGroups);
				case 'FIELD_RELATION':
					// format: '<RELATION>.<RELATION_FIELD>'
					return _checkRelField(e.key.split('.'), setup);
				case 'FIELD_TARGET_FS':
					// format: '<RELATION>.<FACTSHEET_TYPE>.<FIELD>'
					return _checkTargetValue(e.key.split('.'), setup);
				case 'BUILT_IN':
					// the 'build in' stuff is specific for leanix itself,
					// not relevant for the report
					return false;
				default:
					console.error('Unknown viewInfo type "' + e.type + '".');
					return false;
			}
		});
		const viewModels = viewInfos.map((e) => {
			switch (e.type) {
				case 'FIELD':
					return {
						type: fieldModels[e.key].type,
						key: e.key,
						value: e.key,
						label: lx.translateField(factsheetType, e.key),
						originalLabel: e.label,
						rangeLegend: e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false
					};
				case 'TAG':
					return {
						type: e.type,
						key: e.key,
						value: e.key.slice(5), // format: 'tags.<TAG_GROUP_ID>'
						label: 'Tag group: ' + e.label,
						originalLabel: e.label,
						rangeLegend: e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false
					};
				case 'FIELD_RELATION':
					const relFieldValue = e.key.split('.'); // format: '<RELATION>.<RELATION_FIELD>'
					return {
						type: e.type,
						key: e.key,
						value: relFieldValue,
						// TODO see https://github.com/leanix/leanix-reporting/issues/11
						label: lx.translateRelation(relFieldValue[0]) + ': ' + relFieldValue[1],
						originalLabel: e.label,
						rangeLegend: e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false
					};
				case 'FIELD_TARGET_FS':
					const relTargetValue = e.key.split('.'); // format: '<RELATION>.<FACTSHEET_TYPE>.<FIELD>'
					return {
						type: e.type,
						key: e.key,
						value: relTargetValue,
						label: lx.translateRelation(relTargetValue[0]) + ': ' + lx.translateField(relTargetValue[1], relTargetValue[2]),
						originalLabel: e.label,
						rangeLegend: e.viewOptionSupport ? e.viewOptionSupport.usesRangeLegend : false
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
		case 'TAG':
			return 100;
		case 'FIELD_RELATION':
		case 'FIELD_TARGET_FS':
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
	return tagGroup && tagGroup.tags;
}

function _checkRelField(value, setup) {
	const relModel = ReportSetupUtilities.getRelationModel(setup, value[0]);
	return relModel && relModel.fields && relModel.fields[value[1]];
}

function _checkTargetValue(value, setup) {
	const relModel = ReportSetupUtilities.getRelationModel(setup, value[0]);
	if (!relModel) {
		return false;
	}
	const factsheetTypes = ReportSetupUtilities.getFactsheetNames(setup);
	if (!factsheetTypes.includes(value[1])) {
		return false;
	}
	const fieldModels = Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + value[1] + '.fields');
	return fieldModels && fieldModels[value[2]];
}

function create() {
	return {};
}

export default {
	createViewModels: createViewModels,
	create: create
};