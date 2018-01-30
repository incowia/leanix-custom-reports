import Utilities from './common/Utilities';

// regexp are designed to be forgivable regarding case-sensitivity and spaces
const virtualisedRE = /Virtualised/i;
const cloudNativeRE = /Cloud\s*Native/i;
const cloudReadyRE = /Cloud\s*Ready/i;
const cloudTBDRE = /Cloud\s*TBD/i;

// 'FYnn/nn'
const financialYearRE = /FY(\d{2}\/\d{2})/i;

const IDX_CURRENT = 0; // index of today ('current') in marketRow array
const IDX_FY0 = 1; // index of current fiscal year ('fy0') in marketRow array

// singleRules array indexes referenced in 'adoptingApps' (keep in sync with the 'singleRules' definition!)
const RULE_PHYSICAL_APPS = 0;
const RULE_VIRTUAL_APPS = 1;
const RULE_CLOUD_TBD = 2;
const RULE_CLOUD_READY = 3;
const RULE_CLOUD_NATIVE = 4;
const RULE_TOTAL = 5;

const singleRules = [{ // RULE_PHYSICAL_APPS
		name: 'Total number of physical applications',
		additionalNote: 'a \'Cloud Maturity\' tag of \'Physical/Legacy\'.',
		appliesTo: (index, application) => {
			const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
			return cloudMaturityTag && cloudMaturityTag.name === 'Physical/Legacy';
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			marketRow.forEach((fiscalYear) => {
				if (_isOverlapping(fiscalYear, productionPhase) && !_includesID(fiscalYear.apps, application.id)) {
					fiscalYear.apps.push(application);
				}
			});
		}
	}, { // RULE_VIRTUAL_APPS
		name: 'Total number of virtualised applications',
		additionalNote: 'a \'Cloud Maturity\' tag of \'Virtualised\' or '
		 + 'a project with a name that contains \'Virtualised\'.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Virtualised');
			// check and add from projects for financial years
			_addFromProjects(index, application, virtualisedRE, marketRow);
		}
	}, { // RULE_CLOUD_TBD
		name: 'Total number of Cloud TBD applications',
		additionalNote: 'a project with a name that contains \'Cloud TBD\'.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudTBDRE, marketRow);
		}
	}, { // RULE_CLOUD_READY
		name: 'Total number of Cloud Ready applications',
		additionalNote: 'a \'Cloud Maturity\' tag of \'Cloud Ready\' or '
		 + 'a project with a name that contains \'Cloud Ready\'.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Cloud Ready');
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudReadyRE, marketRow);
		}
	}, { // RULE_CLOUD_NATIVE
		name: 'Total number of Cloud Native applications',
		additionalNote: 'a \'Cloud Maturity\' tag of \'Cloud Native\' or '
		 + 'a project with a name that contains \'Cloud Native\'.',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			// check and add from tag for financial years
			_addFromCloudMaturity(index, application, productionPhase, marketRow, 'Cloud Native');
			// check and add from projects for financial years
			_addFromProjects(index, application, cloudNativeRE, marketRow);
		}
	}, { // RULE_TOTAL
		name: 'Total number of deployed applications according to IT scope',
		additionalNote: 'a \'Lifecycle Phase\' of \'Active\' '
		 + 'and/or \'Phase Out\' in the respective financial year.',
		overallRule: true,
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, productionPhase, marketRow, config) => {
			marketRow.forEach((fiscalYear) => {
				if (_isOverlapping(fiscalYear, productionPhase) && !_includesID(fiscalYear.apps, application.id)) {
					fiscalYear.apps.push(application);
				}
			});
		}
	}
];

const adoptingApps = {
	name: '% Cloud applications',
	compute: (marketRows, config) => {
		const result = {};
		const tbdRow = marketRows[singleRules[RULE_CLOUD_TBD].name];
		const readyRow = marketRows[singleRules[RULE_CLOUD_READY].name];
		const nativeRow = marketRows[singleRules[RULE_CLOUD_NATIVE].name];
		const totalRow = marketRows[singleRules[RULE_TOTAL].name];
		totalRow.forEach((e, i) => {
			const nTbd = tbdRow[i].apps.length;
			const nReady = readyRow[i].apps.length;
			const nNative = nativeRow[i].apps.length;
			const nTotal = totalRow[i].apps.length;
			/* formula:
			index  0: current -> (       nReady + nNative) * 100 / total
			index  1: fy0     -> (       nReady + nNative) * 100 / total
			index >1: fy1...n -> (nTbd + nReady + nNative) * 100 / total
			 */
			const percentage = nTotal === 0 ? 0 : ((i > IDX_FY0 ? nTbd : 0) + nReady + nNative) * 100 / nTotal;
			result[i === IDX_CURRENT ? 'current' : 'fy' + (i - 1)] = Math.round(percentage * 10) / 10;
		});
		return result;
	}
};

function _includesID(apps, id) {
	return apps.some((e) => {
		return e.id === id;
	});
}

function _isOverlapping(first, second) {
	if (!first || !second) {
		return false;
	}
	// timestamps for 'start' are inclusive, 'end' are exclusive
	if (first.end <= second.start || first.start >= second.end) {
		return false;
	}
	return true;
}

/*
 * Check a project's name whether or not it passes a 'fiscal year search' regular expression
 * @returns -1 or the market row's index of the identified fiscal year
 * -1 ... no match
 *  1 ... current fiscal year
 *  6 ... 5 years later
 */
function _getFinancialYearIndexFromProject(project, cloudRE, marketRow) {
	if (!cloudRE.test(project.name)) {
		return -1;
	}
	// get financial year
	const m = financialYearRE.exec(project.name);
	if (!m) {
		return -1;
	}
	return marketRow.findIndex((e) => {
		return e.name === m[1];
	});
}

/*
 * index: an index over all of the requested workspace objects (dataset)
 * application: the application-under-investigation
 * cloudRE: the Reg Expression to check the related project names
 * marketRow: a (single) rule's 'fiscal years' array, to gather the fitting applications per rule and fiscal year
 * marketRow[0] ... current (i.e. today)
 * marketRow[1] ... fy0 (current fiscal year)
 * marketRow[6] ... fy5 (5 years later)
 */
function _addFromProjects(index, application, cloudRE, marketRow) {
	const subIndex = application.relApplicationToProject;
	if (!subIndex) {
		return;
	}
	// subindex holds all the projects related to the given application
	subIndex.nodes.forEach((rel) => {
		// access project object
		const project = index.byID[rel.id];
		const fyIndex = _getFinancialYearIndexFromProject(project, cloudRE, marketRow);
		if (fyIndex < 0) {
			return;
		}
		// add application for 'this' fiscal year and everyone after 'this'
		for (let i = fyIndex; i < marketRow.length; i++) {
			const fiscalYear = marketRow[i];
			if (!_includesID(fiscalYear.apps, application.id)) {
				fiscalYear.apps.push(application);
			}
		}
	});
}

function _addFromCloudMaturity(index, application, productionPhase, marketRow, cloudMaturityTagName) {
	const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
	if (cloudMaturityTag && cloudMaturityTag.name === cloudMaturityTagName) {
		marketRow.forEach((fiscalYear) => {
			if (_isOverlapping(fiscalYear, productionPhase) && !_includesID(fiscalYear.apps, application.id)) {
				fiscalYear.apps.push(application);
			}
		});
	}
}

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	adoptingApps: adoptingApps
};
