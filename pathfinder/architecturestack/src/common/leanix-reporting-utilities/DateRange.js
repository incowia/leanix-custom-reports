/* The MIT License (MIT)

Copyright (c) 2018 LeanIX GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE. */

// from https://github.com/leanix/leanix-custom-reports

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