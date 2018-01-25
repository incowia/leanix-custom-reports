import Utilities from './common/Utilities';

// regexp are designed to be forgivable regarding case-sensitivity and spaces
const virtualisedRE = /Virtualised/i;
const cloudNativeRE = /Cloud\s*Native/i;
const cloudReadyRE = /Cloud\s*Ready/i;
const cloudTBDRE = /Cloud\s*TBD/i;

// 'FYnn/nn'
const financialYearRE = /FY(\d{2}\/\d{2})/i;

// singleRules array indexes referenced in 'adoptingApps' member (keep in sync with the 'singleRules' definition!)
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
			marketRow.forEach((e) => {
				if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
					e.apps.push(application);
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
			marketRow.forEach((e) => {
				if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
					e.apps.push(application);
				}
			});
		}
	}
];

const adoptingApps = {
	name: '% Cloud applications',
	compute: (marketRows, config) => {
		const result = {};
		const cloudTBDRow = marketRows[singleRules[RULE_CLOUD_TBD].name];
		const cloudReadyRow = marketRows[singleRules[RULE_CLOUD_READY].name];
		const cloudNativeRow = marketRows[singleRules[RULE_CLOUD_NATIVE].name];
		const totalRow = marketRows[singleRules[RULE_TOTAL].name];
		totalRow.forEach((e, i) => {
			const cloudTBD = cloudTBDRow[i].apps.length;
			const cloudReady = cloudReadyRow[i].apps.length;
			const cloudNative = cloudNativeRow[i].apps.length;
			const total = totalRow[i].apps.length;
			/* formula:
			fy0   -> (cloudTBD + cloudReady + cloudNative) * 100 / total
			fy1..n & current -> (cloudReady + cloudNative) * 100 / total
			 */
			const percentage = total === 0 ? 0
				 : ((i === 0 ? 0 : cloudTBD) + cloudReady + cloudNative) * 100 / total;
			result[(i > 0 ? 'fy' + (i - 1) : 'current')] = Math.round(percentage * 10) / 10;
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
	if (first.end < second.start || first.start > second.end) {
		return false;
	}
	return true;
}

function _getFinancialYearFromProject(project, cloudRE, marketRow) {
	if (!cloudRE.test(project.name)) {
		return;
	}
	// get financial year
	const m = financialYearRE.exec(project.name);
	if (!m) {
		return;
	}
	return marketRow.findIndex((e) => {
		return e.name === m[1];
	});
}

function _addFromProjects(index, application, cloudRE, marketRow) {
	const subIndex = application.relApplicationToProject;
	if (!subIndex) {
		return;
	}
	subIndex.nodes.forEach((e) => {
		// access projects
		const project = index.byID[e.id];
		const financialYearIndex = _getFinancialYearFromProject(project, cloudRE, marketRow);
		const financialYear = marketRow[financialYearIndex];
		if (financialYear && !_includesID(financialYear.apps, application.id)) {
			financialYear.apps.push(application);
			// TODO das irgendwie anders gestalten
			if (financialYear.isCurrentYear && financialYearIndex > 0) {
				// the 'current' column is always right before the current fiscal year!
				marketRow[financialYearIndex - 1].apps.push(application);
			}
			// add application for future financial years as well
			for (let i = financialYearIndex + 1; i < marketRow.length; i++) {
				const futureFY = marketRow[i];
				if (!_includesID(futureFY.apps, application.id)) {
					futureFY.apps.push(application);
				}
			}
		}
	});
}

function _addFromCloudMaturity(index, application, productionPhase, marketRow, cloudMaturityTagName) {
	const cloudMaturityTag = index.getFirstTagFromGroup(application, 'Cloud Maturity');
	if (cloudMaturityTag && cloudMaturityTag.name === cloudMaturityTagName) {
		marketRow.forEach((e) => {
			if (_isOverlapping(e, productionPhase) && !_includesID(e.apps, application.id)) {
				e.apps.push(application);
			}
		});
	}
}

export default {
	ruleCount: singleRules.length + 1,
	singleRules: singleRules,
	adoptingApps: adoptingApps
};
