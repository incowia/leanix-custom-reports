function getCurrentLifecycle(application) {
	if (!application.lifecycle || !application.lifecycle.asString
		 || !application.lifecycle.phases || !Array.isArray(application.lifecycle.phases)) {
		return;
	}
	const currentPhase = application.lifecycle.asString;
	let result = undefined;
	if (currentPhase) {
		result = application.lifecycle.phases.find((e) => {
			return e.phase === currentPhase;
		});
	} else {
		// TODO analyse startDate
	}
	if (!result) {
		return;
	}
	return {
		phase: result.phase,
		startDate: Date.parse(result.startDate + ' 00:00:00')
	};
}

function getLifecycleModel(setup, factsheetName) {
	if (!setup) {
		return [];
	}
	if (factsheetName) {
		const factsheetModel = setup.settings.dataModel.factSheets[factsheetName];
		if (!factsheetModel || !factsheetModel.fields || !factsheetModel.fields.lifecycle
			 || factsheetModel.fields.lifecycle.type !== 'LIFECYCLE'
			 || !factsheetModel.fields.lifecycle.inView || !factsheetModel.fields.lifecycle.inFacet
			 || !Array.isArray(factsheetModel.fields.lifecycle.values)) {
			return [];
		}
		return factsheetModel.fields.lifecycle.values;
	} else {
		// TODO iterate all factsheets and compose the array
	}
}

function getLifecycles(node) {
	if (!node || !node.lifecycle || !node.lifecycle.phases
		 || !Array.isArray(node.lifecycle.phases)) {
		return [];
	}
	return node.lifecycle.phases.map((e) => {
		return {
			phase: e.phase,
			startDate: Date.parse(e.startDate + ' 00:00:00')
		};
	});;
}

function getKeyToValue(obj, value) {
	if (!obj) {
		return;
	}
	for (let key in obj) {
		if (obj[key] === value) {
			return key;
		}
	}
}

function isProductionPhase(lifecycle) {
	if (!lifecycle || !lifecycle.phase) {
		return false;
	}
	switch (lifecycle.phase) {
		case 'phaseIn':
		case 'active':
		case 'phaseOut':
			return true;
		case 'plan':
		case 'endOfLife':
		default:
			return false;
	}
}

const marketRE = /^([A-Z]+)_/;

function getMarket(application) {
	if (!application) {
		return;
	}
	const m = marketRE.exec(application.name);
	if (!m) {
		return;
	}
	return m[1]; // first one is the match, followed by group matches
}

function copyObject(obj) {
	const result = {};
	if (!obj) {
		return result;
	}
	for (let key in obj) {
		result[key] = obj[key];
	}
	return result;
}

export default {
	getCurrentLifecycle: getCurrentLifecycle,
	getLifecycleModel: getLifecycleModel,
	getLifecycles: getLifecycles,
	getKeyToValue: getKeyToValue,
	isProductionPhase: isProductionPhase,
	getMarket: getMarket,
	copyObject: copyObject
};