const VALID_COLORS = _toSet(['green', 'yellow', 'orange', 'red', 'gray', 'grey', 'white', 'blue', 'pink']);

const COLOR_TEXT_REGEXP = /(platform|csmado|simobs)\((?:\s*(\d*)\s*,)?\s*((?:[a-z]+)(?:\s*,\s*(?:[a-z]+))*)\s*\)/g;

const WHITESPACE_REGEXP = /\s*/g;

const TEST_STRING = `csmado( blue )
simobs(yellow, green)
platform(yellow,green)
csmado(red, yellow, green)
simobs(red, yellow,green)
platform(1, blue)platform(1, orange)
csmado(2,blue )
simobs(1 , blue )
simobs(3, yellow, green)
platform(3, yellow,green)
csmado(3, red, yellow, green)
simobs(3, red, yellow,green)`;

function getColors(colorText, isIntegration) {
	if (!colorText) {
		colorText = TEST_STRING;
	}
	// do not modify the source string -> copy, then trim
	const text = ''.concat(colorText).trim();
	if (!text) {
		return;
	}
	const result = {};
	let tmp;
	while ((tmp = COLOR_TEXT_REGEXP.exec(text)) !== null) {
		const view = tmp[1];
		const position = tmp[2] !== undefined ? parseInt(tmp[2], 10) : 0;
		let colors = tmp[3];
		if (!view || !colors) {
			continue;
		}
		console.log(view + '\t' + position + '\t' + colors + ' [' + tmp[0] + ']');
	}
	// reset regexp
	COLOR_TEXT_REGEXP.lastIndex = 0;

	return {
		platform: [{
				'factsheet-id-001': 'linear-gradient(to right, yellow, green)',
				'factsheet-id-002': 'linear-gradient(to right, red, yellow, green)',
				'factsheet-id-003': 'green'
			}
		],
		csmado: [],
		simobs: []
	};
}

function _toSet(array) {
	return array.reduce((r, e) => {
		r[e] = '';
		return r;
	}, {});
}

export default {
	getColors: getColors
};
