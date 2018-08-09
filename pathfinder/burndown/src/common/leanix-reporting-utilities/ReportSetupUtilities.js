/* The MIT License (MIT)

Copyright (c) 2018 LeanIX GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

// from https://github.com/leanix/leanix-custom-reports

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