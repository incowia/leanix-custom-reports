// color definitions
const GREEN = {
	name: 'green',
	cssColor: 'lightgreen'
};
const YELLOW = {
	name: 'yellow',
	cssColor: 'yellow'
};
const ORANGE = {
	name: 'orange',
	cssColor: 'orange'
};
const RED = {
	name: 'red',
	cssColor: '#FF5656'
};
const GRAY = {
	name: 'gray',
	cssColor: 'silver'
};
const GREY = {
	name: 'grey',
	cssColor: GRAY.cssColor
};
const WHITE = {
	name: 'white',
	cssColor: 'white'
};
const BLUE = {
	name: 'blue',
	cssColor: 'deepskyblue'
};
const PINK = {
	name: 'pink',
	cssColor: 'pink'
};
const COLOR_MAP = {};
COLOR_MAP[GREEN.name] = GREEN.cssColor;
COLOR_MAP[YELLOW.name] = YELLOW.cssColor;
COLOR_MAP[ORANGE.name] = ORANGE.cssColor;
COLOR_MAP[RED.name] = RED.cssColor;
COLOR_MAP[GRAY.name] = GRAY.cssColor;
COLOR_MAP[GREY.name] = GREY.cssColor;
COLOR_MAP[WHITE.name] = WHITE.cssColor;
COLOR_MAP[BLUE.name] = BLUE.cssColor;
COLOR_MAP[PINK.name] = PINK.cssColor;

const FALLBACK_COLOR = WHITE.name;

const VALID_COLORS = Object.keys(COLOR_MAP).join('|');

// legend definitions
const LEGEND_PLATFORM_TRANFORMATION_VIEW = [{
		color: GREEN.cssColor,
		text: 'Target Platform already in place'
	}, {
		color: YELLOW.cssColor,
		text: 'Plan to Adopt platform from another market'
	}, {
		color: ORANGE.cssColor,
		text: 'Step-wise evolution to target'
	}, {
		color: RED.cssColor,
		text: 'Plan to build new target capability'
	}, {
		color: GRAY.cssColor,
		text: 'Plan to wrap existing legacy'
	}, {
		color: WHITE.cssColor,
		text: 'Not specific to the view'
	}, {
		color: BLUE.cssColor,
		text: 'Plan is not clear'
	}, {
		color: PINK.cssColor,
		text: 'No information available / not supported by IT'
	}
];
const LEGEND_CSM_ADOPTION_VIEW = LEGEND_PLATFORM_TRANFORMATION_VIEW;
const LEGEND_SIMPLIFICATION_OBSOLESCENCE_VIEW = [{
		color: GREEN.cssColor,
		text: 'There is a <=25% gap between the current and target # of applications'
	}, {
		color: YELLOW.cssColor,
		text: 'There is a >25% to <50% gap between the current and target # of applications'
	}, {
		color: RED.cssColor,
		text: 'There is a >50% gap between the current and target # of applications'
	}
];

// key definitions
const KEY_PLATFORM = 'platform';
const KEY_CSMADO = 'csmado';

const VALID_KEYS = [KEY_PLATFORM, KEY_CSMADO];

// stack definitions
const STACK_COMMON = 'common';
const STACK_CONSUMER = 'consumer';
const STACK_ENTERPRISE = 'enterprise';
const STACK_MOBILE = 'mobile';
const STACK_FIXED = 'fixed';

const VALID_STACKS = [STACK_COMMON, STACK_CONSUMER, STACK_ENTERPRISE, STACK_MOBILE, STACK_FIXED];

// regexp's for later use
const COLOR_BLOCKS_REGEXP = new RegExp('(' + VALID_KEYS.join('|') + ')(?:\\s*\\:\\s*(' + VALID_STACKS.join('|') + '))?\\s*\\((?:\\s*([1-9]|[1-9]\\d*)\\s*,)?\\s*((?:' + VALID_COLORS + ')(?:\\s*,\\s*(?:' + VALID_COLORS + '))*)\\s*\\)', 'g');

const CSM_ADOPTION_TARGET_REGEXP = new RegExp('csmadoption\\s*target\\s*(' + VALID_STACKS.join('|') + ')?\\s*(\\d+)', 'gi');

const NARRATIVE_REGEXP = new RegExp('narrative\\s*:\\s*((?:\\*\\s*.*\\s*)*)*', 'gi');

function _prepareBlockColors(result, market) {
	const resultForBlockColors = {
		name: market.name
	};
	result.blockColors[market.id] = resultForBlockColors;
	// add keys
	VALID_KEYS.forEach((key) => {
		resultForBlockColors[key] = {};
	});
	// add stacks
	VALID_STACKS.forEach((stack) => {
		for (let key in resultForBlockColors) {
			if (key === 'name') {
				continue;
			}
			resultForBlockColors[key][stack] = {};
		}
	});
	return resultForBlockColors;
}

function _prepareCSMAdoTarget(result, market) {
	const resultForCSMAdoTarget = {
		name: market.name
	};
	result.csmAdoTargets[market.id] = resultForCSMAdoTarget;
	// add stacks
	VALID_STACKS.forEach((stack) => {
		resultForCSMAdoTarget[stack] = {};
	});
	return resultForCSMAdoTarget;
}

function _prepareNarrative(result, market) {
	const resultForNarrative = {
		name: market.name
	};
	result.narratives[market.id] = resultForNarrative;
	return resultForNarrative;
}

function parse(markets, platforms) {
	if (!markets || !platforms) {
		return;
	}
	const result = {
		blockColors: {},
		csmAdoTargets: {},
		narratives: {}
	};
	markets.forEach((market) => {
		const resultForCSMAdoTarget = _prepareCSMAdoTarget(result, market);
		const resultForBlockColors = _prepareBlockColors(result, market);
		const resultForNarrative = _prepareNarrative(result, market);
		const subIndex = market.relToRequires;
		if (!subIndex) {
			return;
		}
		subIndex.nodes.forEach((rel) => {
			const platform = platforms[rel.id];
			// parse content
			const text = rel.relationAttr.description;
			const csmAdoTargets = _getCSMAdoptionTargets(text);
			const colors = _getColors(text);
			const narratives = _getNarratives(text);
			// handle CSM Adoption target values
			for (let key in csmAdoTargets) {
				const stack = resultForCSMAdoTarget[key];
				stack[platform.id] = csmAdoTargets[key];
			}
			// handle color blocks
			for (let key in colors) {
				const view = resultForBlockColors[key];
				for (let key2 in colors[key]) {
					let stack = view[key2][platform.id];
					if (!stack) {
						stack = [];
						view[key2][platform.id] = stack;
					}
					view[key2][platform.id] = stack.concat(colors[key][key2]);
				}
			}
			// handle narratives
			if (narratives.length > 0) {
				resultForNarrative[platform.id] = narratives;
			}
		});
	});
	// transform mapping to ColorScheme objects
	for (let key in result.blockColors) {
		const views = result.blockColors[key];
		for (let key2 in views) {
			if (key2 === 'name') {
				continue;
			}
			const view = views[key2];
			for (let key3 in view) {
				view[key3] = new ColorScheme(view[key3]);
			}
		}
	}
	return result;
}

function _getColors(text) {
	if (!text) {
		return {};
	}
	const result = {};
	let tmpArray;
	while ((tmpArray = COLOR_BLOCKS_REGEXP.exec(text)) !== null) {
		const view = tmpArray[1];
		const stack = tmpArray[2] !== undefined ? tmpArray[2] : STACK_COMMON;
		const position = tmpArray[3] !== undefined ? parseInt(tmpArray[3], 10) - 1 : 0;
		let colors = tmpArray[4];
		if (!view || !colors) {
			continue;
		}
		let tmp = result[view];
		if (!tmp) {
			tmp = {};
			result[view] = tmp;
		}
		let tmp2 = tmp[stack];
		if (!tmp2) {
			tmp2 = [];
			tmp[stack] = tmp2;
		}
		tmp2[position] = _buildCSSBackground(colors);
	}
	// reset regexp
	COLOR_BLOCKS_REGEXP.lastIndex = 0;
	return result;
}

function _buildCSSBackground(colors) {
	if (colors.includes(',')) {
		// multiple colors, use linear-gradient
		const colorArray = colors.split(',');
		colors = colorArray.map((e) => {
			return COLOR_MAP[e.trim()];
		}).join(',');
		return 'linear-gradient(to right, ' + colors + ')'
	}
	// only one, use it directly
	return COLOR_MAP[colors.trim()];
}

function _getCSMAdoptionTargets(text) {
	if (!text) {
		return {};
	}
	const result = {};
	let tmpArray;
	while ((tmpArray = CSM_ADOPTION_TARGET_REGEXP.exec(text)) !== null) {
		const stack = tmpArray[1] !== undefined ? tmpArray[1] : STACK_COMMON;
		const targetValue = tmpArray[2] !== undefined ? parseInt(tmpArray[2], 10) : 0;
		if (targetValue === undefined || targetValue === null) {
			continue;
		}
		result[stack] = targetValue;
	}
	// reset regexp
	CSM_ADOPTION_TARGET_REGEXP.lastIndex = 0;
	return result;
}

function _getNarratives(text) {
	if (!text) {
		return [];
	}
	let result = [];
	let tmpArray;
	while ((tmpArray = NARRATIVE_REGEXP.exec(text)) !== null) {
		const narlist = tmpArray[1];
		if (!narlist) {
			continue;
		}
		result = result.concat(narlist.split('*').map((e) => {
			return e.trim();
		}).filter((e) => {
			return e !== undefined && e !== null && e.length > 0;
		}));
	}
	// reset regexp
	NARRATIVE_REGEXP.lastIndex = 0;
	return result;
}

class ColorScheme {

	constructor(mapping) {
		this._mapping = mapping;
	}

	getColor(id, number) {
		if (!number) {
			number = 0;
		}
		if (!id) {
			return FALLBACK_COLOR;
		}
		const platform = this._mapping[id];
		if (!platform) {
			return FALLBACK_COLOR;
		}
		const color = platform[number];
		return !color ? FALLBACK_COLOR : color;
	}
}

export default {
	LEGEND_PLATFORM_TRANFORMATION: LEGEND_PLATFORM_TRANFORMATION_VIEW,
	LEGEND_CSM_ADOPTION: LEGEND_CSM_ADOPTION_VIEW,
	LEGEND_SIMPLIFICATION_OBSOLESCENCE: LEGEND_SIMPLIFICATION_OBSOLESCENCE_VIEW,
	parse: parse
};
