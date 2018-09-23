/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

import DateUtilities from './DateUtilities';

class DateRange {

	constructor(start, end, startInclusive, endInclusive) {
		this.start = DateUtilities.getTimestamp(start);
		this.end = DateUtilities.getTimestamp(end);
		_check(this);
		this.startInclusive = !!startInclusive;
		this.endInclusive = !!endInclusive;
	}

	getStart() {
		return this.start ? this.start : 0;
	}

	getEnd() {
		return this.end ? this.end : DateUtilities.MAX_TIMESTAMP;
	}

	getLength() {
		return this.getEnd() - this.getStart();
	}

	contains(date) {
		_check(this);
		const ts = DateUtilities.getTimestamp(date);
		if (ts === undefined || ts === null) {
			return false;
		}
		if (this.startInclusive) {
			// this.getStart() <= ts <= this.getEnd()
			// this.getStart() <= ts < this.getEnd()
			return this.getStart() <= ts && (this.endInclusive ? ts <= this.getEnd() : ts < this.getEnd());
		} else {
			// this.getStart() < ts <= this.getEnd()
			// this.getStart() < ts < this.getEnd()
			return this.getStart() < ts && (this.endInclusive ? ts <= this.getEnd() : ts < this.getEnd());
		}
	}

	containsRange(range) {
		_check(this);
		if (!(range instanceof DateRange)) {
			return false;
		}
		let start = false;
		if (this.startInclusive) {
			if (range.startInclusive) {
				start = this.getStart() <= range.getStart();
			} else {
				start = this.getStart() < range.getStart();
			}
		} else {
			if (range.startInclusive) {
				start = this.getStart() < range.getStart();
			} else {
				start = this.getStart() <= range.getStart();
			}
		}
		let end = false;
		if (this.endInclusive) {
			if (range.endInclusive) {
				end = this.getEnd() >= range.getEnd();
			} else {
				end = this.getEnd() > range.getEnd();
			}
		} else {
			if (range.endInclusive) {
				end = this.getEnd() > range.getEnd();
			} else {
				end = this.getEnd() >= range.getEnd();
			}
		}
		return start && end;
	}

	overlaps(range) {
		_check(this);
		if (!(range instanceof DateRange)) {
			return false;
		}
		let outsideLeft = false;
		if (this.startInclusive) {
			if (range.endInclusive) {
				outsideLeft = this.getStart() > range.getEnd();
			} else {
				outsideLeft = this.getStart() >= range.getEnd();
			}
		} else {
			outsideLeft = this.getStart() >= range.getEnd();
		}
		let outsideRight = false;
		if (this.endInclusive) {
			if (range.startInclusive) {
				outsideRight = this.getEnd() < range.getStart();
			} else {
				outsideRight = this.getEnd() <= range.getStart();
			}
		} else {
			outsideRight = this.getEnd() <= range.getStart();
		}
		if (outsideLeft || outsideRight) {
			return false;
		}
		return true;
	}
}

function _check(range) {
	// a range of the length 0 is allowed
	if (range.getLength() < 0) {
		throw 'Param "end" must be greater than or equal to param "start".';
	}
}

export default DateRange;