// NOTE: these colors need to be in sync with the legend definitions in Report.js
const VALID_COLORS = ['green', 'yellow', 'orange', 'red', 'gray', 'grey', 'white', 'blue', 'pink'].join('|');

const VALID_STACKS = ['default', 'consumer', 'enterprise', 'mobile', 'fixed'];

const COLOR_TEXT_REGEXP = new RegExp('(platform|csmado|simobs)(?:\\s*\\:\\s*(' + VALID_STACKS.join('|') + '))?\\s*\\((?:\\s*(\\d*)\\s*,)?\\s*((?:' + VALID_COLORS + ')(?:\\s*,\\s*(?:' + VALID_COLORS + '))*)\\s*\\)', 'g');

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
	markets.forEach((e) => {
		result[e.id] = { // id of market (UserGroup) as key
			name: e.name,
			platform: {},
			csmado: {},
			simobs: {}
		};
		// add stacks
		VALID_STACKS.forEach((e2) => {
			for (let key in result[e.id]) {
				if (key === 'name') {
					continue;
				}
				result[e.id][key][e2] = {};
			}
		});
		const subIndex = e.relToRequires;
		if (!subIndex) {
			return;
		}
		subIndex.nodes.forEach((e2) => {
			if (!platforms[e2.id]) {
				return;
			}
			const colorText = e2.relationAttr.description;
			const colors = _getColors(TEST_STRING); // TODO change to 'colorText', when data is present
			if (!colors) {
				return;
			}
			for (let key in colors) {
				const view = result[e.id][key];
				for (let key2 in colors[key]) {
					let stack = view[key2][e2.id];
					if (!stack) {
						stack = [];
						view[key2][e2.id] = stack;
					}
					view[key2][e2.id] = stack.concat(colors[key][key2]);
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
		const stack = tmpArray[2] !== undefined ? tmpArray[2] : VALID_STACKS[0];
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
			return 'pink';
		}
		const color = this._mapping[id][number];
		return !color ? 'pink' : color;
	}
}

export default {
	parse: parse
};
