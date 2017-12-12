import Utilities from './common/Utilities';

const CURRENT_DATE = new Date();
CURRENT_DATE.setHours(0, 0, 0, 0);
const ONE_YEAR_BEFORE_DATE = new Date();
ONE_YEAR_BEFORE_DATE.setHours(0, 0, 0, 0);
ONE_YEAR_BEFORE_DATE.setFullYear(ONE_YEAR_BEFORE_DATE.getFullYear() - 1);

const CURRENT = CURRENT_DATE.getTime();
const ONE_YEAR_BEFORE = ONE_YEAR_BEFORE_DATE.getTime();

const singleRules = [{
		name: 'Adding application has project (w/ impact \'Adds\', must have an active phase defined)',
		additionalNote: 'Rule includes applications which have a current life cycle phase of either'
			+ ' \'Plan\', \'Phase In\' or \'Active\' and the start date of this phase must be greater than or equal to'
			+ ' todays date minus 1 year. The date is computed dynamically.',
		appliesTo: (index, application) => {
			const lifecycles = Utilities.getLifecycles(application);
			const activePhase = Utilities.getLifecyclePhase(lifecycles, 'active');
			if (!activePhase) {
				return false;
			}
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return _isAddingPhase(currentLifecycle) && currentLifecycle.startDate >= ONE_YEAR_BEFORE;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Adds');
		}
	}, {
		name: 'Retiring application has project (w/ impact \'Sunsets\')',
		additionalNote: 'Rule includes applications which have a life cycle phase of'
			+ ' \'End Of Life\' and the start date of this phase must be greater than or equal to'
			+ ' todays date minus 1 year. The date is computed dynamically.',
		appliesTo: (index, application) => {
			return _isRetiring(application);
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToProject;
			if (!subIndex) {
				return false;
			}
			return _hasProjectWithImpact(subIndex, 'Sunsets');
		}
	}, {
		name: 'has COBRA (only active, exactly one)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToBusinessCapability;
			if (!subIndex) {
				return false;
			}
			const compliantBCs = subIndex.nodes.filter((e) => {
					// access businessCapabilities
					const bc = index.byID[e.id];
					return bc && (!config.appMapId ? index.includesTag(bc, 'AppMap') : true);
				});
			return compliantBCs.length === 1;
		}
	}, {
		name: 'has \'COTS Package\' TagGroup assigned (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'COTS Package') ? true : false;
		}
	}, {
		name: 'has Software Product (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
			 && index.includesTag(application, 'COTS Package');
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			if (!subIndex) {
				return false;
			}
			const compliantITComp = subIndex.nodes.find((e) => {
					// access itComponents
					return index.byID[e.id];
				});
			return compliantITComp ? true : false;
		}
	}, {
		name: 'has Vendor but is missing a Software Product (only active, w/ Tag \'COTS Package\')',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active'
			 && index.includesTag(application, 'COTS Package')
			 && application.relApplicationToITComponent;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToITComponent;
			const compliantITComp = subIndex.nodes.find((e) => {
					// access itComponents
					return index.byID[e.id];
				});
			// access itComponents
			return !index.includesTag(compliantITComp ? index.byID[compliantITComp.id] : undefined, 'Placeholder');
		}
	}, {
		name: 'has Description (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.description ? true : false;
		}
	}, {
		name: 'has Lifecycle',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			return Utilities.hasLifecycle(application);
		}
	}, {
		name: 'has IT Owner (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'IT Owner');
		}
	}, {
		name: 'has SPOC (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return _hasSubscriptionRole(application, 'SPOC');
		}
	}, {
		name: 'has Business Value (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.functionalSuitability ? true : false;
		}
	}, {
		name: 'has Technical Condition (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return application.technicalSuitability ? true : false;
		}
	}, {
		name: 'has \'Cost Centre\' TagGroup assigned (only active)',
		appliesTo: (index, application) => {
			const currentLifecycle = Utilities.getCurrentLifecycle(application);
			return currentLifecycle && currentLifecycle.phase === 'active';
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'CostCentre') ? true : false;
		}
	}, {
		name: 'has an owning local market',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			return subIndex && subIndex.nodes.length === 1;
		}
	}, {
		name: 'name prefix matches it\'s owning user group',
		additionalNote: 'Applications starting with \'CW\' or \'UK\' are allowed to have the owning user group \'CW\' or \'UK\'.',
		appliesTo: (index, application) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			if (!subIndex) {
				return false;
			}
			// access userGroups
			const owningUG = index.byID[subIndex.nodes[0].id];
			return owningUG ? true : false;
		},
		compute: (index, application, config) => {
			const subIndex = application.relApplicationToOwningUserGroup;
			// access userGroups
			const owningUG = index.byID[subIndex.nodes[0].id];
			let currentUG = owningUG;
			while (currentUG) {
				let checkResult = false;
				// exceptions by v
				if (config.market === 'CW') {
					checkResult = currentUG.name === 'CW' || currentUG.name === 'UK';
				} else if (config.market === 'UK') {
					checkResult = currentUG.name === 'CW' || currentUG.name === 'UK';
				} else {
					checkResult = owningUG.name === config.market;
				}
				if (checkResult) {
					return true;
				}
				// check the parent next
				const parent = index.getParent('userGroups', currentUG.id);
				if (!parent) {
					break;
				}
				currentUG = parent;
			}
			return false;
		}
	}, {
		name: 'has \'Recommendation\' TagGroup assigned',
		appliesTo: (index, application) => {
			return true;
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'Recommendation') ? true : false;
		}
	}, {
		name: 'Retiring application should have a recommendation of \'Decommission\', \'Replace\' or \'Consolidate\'',
		additionalNote: 'Rule includes applications which have a future life cycle phase of \'End Of Life\', and \'Recommendation\''
			+ ' TagGroup assignment defined.',
		appliesTo: (index, application) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			return recommendationTag && _hasEndOfLife(application) && _isNotInEndOfLifePhase(application);
		},
		compute: (index, application, config) => {
			const recommendationTag = index.getFirstTagFromGroup(application, 'Recommendation');
			switch (recommendationTag.name) {
				case 'Decommission':
				case 'Replace':
				case 'Consolidate':
					return true;
				default:
					return false;
			}
		}
	}, {
		name: 'has \'Cloud Maturity\' TagGroup assigned',
		additionalNote: 'Rule includes applications which currently are not in \'End Of Life\' phase.',
		appliesTo: (index, application) => {
			return _isNotInEndOfLifePhase(application);
		},
		compute: (index, application, config) => {
			return index.getFirstTagFromGroup(application, 'Cloud Maturity') ? true : false;
		}
	}
];

function _hasEndOfLife(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
			return e.phase === 'endOfLife';
		});
	return phase !== undefined && phase !== null;
}

function _isNotInEndOfLifePhase(application) {
	const lifecycles = Utilities.getLifecycles(application);
	const endOfLife = Utilities.getLifecyclePhase(lifecycles, 'endOfLife');
	return endOfLife ? (endOfLife.startDate > CURRENT) : true;
}

function _isRetiring(application) {
	if (!application || !application.lifecycle || !application.lifecycle.phases
		 || !Array.isArray(application.lifecycle.phases)) {
		return false;
	}
	const phase = application.lifecycle.phases.find((e) => {
			return e.phase === 'endOfLife' && e.startDate && Utilities.parseDateString(e.startDate) >= ONE_YEAR_BEFORE;
		});
	return phase !== undefined && phase !== null;
}

function _hasProjectWithImpact(subIndex, impact) {
	return subIndex.nodes.some((e) => {
		return e.relationAttr.projectImpact === impact;
	});
}

function _hasSubscriptionRole(application, subscriptionRole) {
	const subIndex = application.subscriptions;
	if (!subIndex) {
		return false;
	}
	return subIndex.nodes.find((e) => {
		const roles = e.roles;
		return roles && roles.find((e2) => {
			return e2.name === subscriptionRole;
		});
	});
}

function _isAddingPhase(lifecycle) {
	if (!lifecycle || !lifecycle.phase) {
		return false;
	}
	switch (lifecycle.phase) {
		case 'plan':
		case 'phaseIn':
		case 'active':
			return true;
		case 'phaseOut':
		case 'endOfLife':
		default:
			return false;
	}
}

const appTypeRule = {
	name: 'has \'Application Type\' TagGroup assigned',
	compute: (index, applications, config) => {
		return {
			compliant: undefined,
			nonCompliant: applications
		};
	}
};

const overallRule = {
	name: 'Overall Quality',
	compute: (compliants, nonCompliants, config) => {
		const result = {
			compliant: 0,
			nonCompliant: 0
		};
		for (let key in compliants) {
			result.compliant += compliants[key].length;
			result.nonCompliant += nonCompliants[key].length;
		}
		return result;
	}
};

export default {
	ruleCount: singleRules.length + 2,
	singleRules: singleRules,
	appTypeRule: appTypeRule,
	overallRule: overallRule
};
