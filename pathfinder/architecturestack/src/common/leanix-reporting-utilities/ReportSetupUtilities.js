/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import Utilities from './Utilities';

function getFactsheetNames(setup) {
	const result = Object.keys(Utilities.getFrom(setup, 'settings.dataModel.factSheets'));
	return result.sort();
}

function getFactsheetFieldModels(setup, factsheet) {
	return Utilities.getFrom(setup, 'settings.dataModel.factSheets.' + factsheet + '.fields');
}

function getRelationModel(setup, relName) {
	const mappings = Utilities.getFrom(setup, 'settings.dataModel.relationMapping');
	const relMapName = mappings[relName] ? mappings[relName].persistedName : undefined;
	if (!relMapName) {
		return;
	}
	const relModels = Utilities.getFrom(setup, 'settings.dataModel.relations');
	return relModels[relMapName];
}

export default {
	getFactsheetNames: getFactsheetNames,
	getFactsheetFieldModels: getFactsheetFieldModels,
	getRelationModel: getRelationModel
};