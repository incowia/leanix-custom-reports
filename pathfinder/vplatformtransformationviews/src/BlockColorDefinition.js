// color definitions
const GREEN = 'green';
const YELLOW = 'yellow';
const ORANGE = 'orange';
const RED = 'red';
const GRAY = 'gray';
const GREY = 'grey';
const WHITE = 'white';
const BLUE = 'blue';
const PINK = 'pink';

const FALLBACK_COLOR = PINK;

const VALID_COLORS = [GREEN, YELLOW, ORANGE, RED, GRAY, GREY, WHITE, BLUE, PINK].join('|');

// legend definitions
const LEGEND_PLATFORM_TRANFORMATION_VIEW = [{
		color: GREEN,
		text: 'Target Platform already in place'
	}, {
		color: YELLOW,
		text: 'Plan to Adopt platform from another market'
	}, {
		color: ORANGE,
		text: 'Step-wise evolution to target'
	}, {
		color: RED,
		text: 'Plan to build new target capability'
	}, {
		color: GRAY,
		text: 'Plan to wrap existing legacy'
	}, {
		color: WHITE,
		text: 'Plan to remove capability'
	}, {
		color: BLUE,
		text: 'Plan is not clear'
	}, {
		color: PINK,
		text: 'No information available'
	}
];
const LEGEND_CSM_ADOPTION_VIEW = LEGEND_PLATFORM_TRANFORMATION_VIEW;
const LEGEND_SIMPLIFICATION_OBSOLESCENCE_VIEW = [{
		color: GREEN,
		text: 'There is a <=25% gap between the current and target # of applications'
	}, {
		color: YELLOW,
		text: 'There is a >25% to <50% gap between the current and target # of applications'
	}, {
		color: RED,
		text: 'There is a >50% gap between the current and target # of applications'
	}
];

// key definitions
const KEY_PLATFORM = 'platform';
const KEY_CSMADO = 'csmado';

const VALID_KEYS = [KEY_PLATFORM, KEY_CSMADO];

// stack definitions
const STACK_DEFAULT = 'default';
const STACK_CONSUMER = 'consumer';
const STACK_ENTERPRISE = 'enterprise';
const STACK_MOBILE = 'mobile';
const STACK_FIXED = 'fixed';

const VALID_STACKS = [STACK_DEFAULT, STACK_CONSUMER, STACK_ENTERPRISE, STACK_MOBILE, STACK_FIXED];

// regexp for later use
const COLOR_TEXT_REGEXP = new RegExp('(' + VALID_KEYS.join('|') + ')(?:\\s*\\:\\s*(' + VALID_STACKS.join('|') + '))?\\s*\\((?:\\s*(\\d*)\\s*,)?\\s*((?:' + VALID_COLORS + ')(?:\\s*,\\s*(?:' + VALID_COLORS + '))*)\\s*\\)', 'g');

const WHITESPACE_REGEXP = /\s*/g;

const TEST_STRING = `csmado( blue )
simobs(yellow, green)
platform(yellow,green)
csmado(red, yellow, red, orange)
simobs(red, yellow,green)
platform(1, blue)platform: consumer(1, orange)
csmado(2,blue )
simobs(1 , blue )
simobs(3, yellow, green)
platform(3, pink,green)platform(4, foobar)
csmado(3, red, yellow, green)
simobs (3, red, yellow,green)`;

function parse(index) {
	if (!index) {
		return;
	}
	const markets = index.userGroups.nodes;
	const platforms = index.businessCapabilitiesLvl2.byID;
	const result = {};
	markets.forEach((market) => {
		const resultForMarket = {
			name: market.name
		};
		result[market.id] = resultForMarket;
		// add keys
		VALID_KEYS.forEach((key) => {
			resultForMarket[key] = {};
		});
		// add stacks
		VALID_STACKS.forEach((stack) => {
			for (let key in resultForMarket) {
				if (key === 'name') {
					continue;
				}
				resultForMarket[key][stack] = {};
			}
		});
		const subIndex = market.relToRequires;
		if (!subIndex) {
			return;
		}
		subIndex.nodes.forEach((rel) => {
			if (!platforms[rel.id]) {
				return;
			}
			const colorText = rel.relationAttr.description;
			const colors = _getColors(TEST_STRING); // TODO change to 'colorText', when data is present
			if (!colors) {
				return;
			}
			for (let key in colors) {
				const view = resultForMarket[key];
				for (let key2 in colors[key]) {
					let stack = view[key2][rel.id];
					if (!stack) {
						stack = [];
						view[key2][rel.id] = stack;
					}
					view[key2][rel.id] = stack.concat(colors[key][key2]);
				}
			}
		});
	});
	// TODO das umbauen
	// transform mapping to ColorScheme objects
	for (let key in result) {
		const views = result[key];
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

function _getColors(colorText) {
	if (!colorText) {
		return;
	}
	// do not modify the source string -> copy, then trim
	const text = ''.concat(colorText).trim();
	if (!text) {
		return;
	}
	const result = {};
	let tmpArray;
	while ((tmpArray = COLOR_TEXT_REGEXP.exec(text)) !== null) {
		const view = tmpArray[1];
		const stack = tmpArray[2] !== undefined ? tmpArray[2] : STACK_DEFAULT;
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
	COLOR_TEXT_REGEXP.lastIndex = 0;
	return result;
}

function _buildCSSBackground(colors) {
	if (colors.includes(',')) {
		// multiple colors, use linear-gradient
		return 'linear-gradient(to right, ' + colors + ')'
	}
	// only one, use it directly
	return colors;
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
		const color = this._mapping[id][number];
		return !color ? FALLBACK_COLOR : color;
	}
}

export default {
	LEGEND_PLATFORM_TRANFORMATION_VIEW: LEGEND_PLATFORM_TRANFORMATION_VIEW,
	LEGEND_CSM_ADOPTION_VIEW: LEGEND_CSM_ADOPTION_VIEW,
	LEGEND_SIMPLIFICATION_OBSOLESCENCE_VIEW: LEGEND_SIMPLIFICATION_OBSOLESCENCE_VIEW,
	parse: parse
};
