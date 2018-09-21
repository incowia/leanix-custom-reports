/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact [info -at- incowia.com](info@incowia.com),
if you want to use this code artifact elsewhere.

*/

import DateRange from './DateRange';

class Lifecycle extends DateRange {

	constructor(start, name) {
		super(start, undefined, true, false);
		if (this.start === undefined || this.start === null) {
			throw 'Param "start" is mandatory.';
		}
		if (!name) {
			throw 'Param "name" is mandatory.';
		}
		this.name = name;
		this.previous = undefined;
		this.next = undefined;
	}
}

export default Lifecycle;