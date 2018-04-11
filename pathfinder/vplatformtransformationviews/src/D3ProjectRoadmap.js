import * as d3 from 'd3';

const ONEDAY = 24 * 60 * 60 * 1000;

const PLATFORM_LIST_WIDTH = 160;
const SPACE = 4;
const DATA_AREA_PADDING_LEFT_RIGHT = 30;

class D3ProjectRoadmap {

	constructor(id, timeFrameStart, timeframeEnd) {
		this.id = id;
		this.timeFrame = {
			start: timeFrameStart,
			end: timeframeEnd
		};
		this._createScale = this._createScale.bind(this);
		this._setSize = this._setSize.bind(this);
		this._computeWidth = this._computeWidth.bind(this);
		this._computeHeight = this._computeHeight.bind(this);
		this._drawTimeAxis = this._drawTimeAxis.bind(this);
		this.update = this.update.bind(this);
		this._drawPlatform = this._drawPlatform.bind(this);
		this._drawPlatformBox = this._drawPlatformBox.bind(this);
		this._drawProject = this._drawProject.bind(this);
		this.destroy = this.destroy.bind(this);
		// init the chart & create all basic stuff
		this.svg = this._createSVG(id);
		this.scale = this._createScale();
		console.log(d3);
		console.log(this.svg);
	}

	_createSVG(id) {
		return d3.select('#' + id).append('svg');
	}

	_createScale() {
		return d3.scaleTime()
			.domain([new Date(this.timeFrame.start - ONEDAY), new Date(this.timeFrame.end)])
			.clamp(true);
	}

	_setSize(data) {
		this.svg.attr('width', this._computeWidth())
			.attr('height', this._computeHeight(data));
	}

	_computeWidth() {
		const parent = this.svg.node().parentElement;
		const parentStyle = window.getComputedStyle(parent, null);
		const paddingLeft = parentStyle.getPropertyValue('padding-left');
		const paddingRight = parentStyle.getPropertyValue('padding-right');
		return Math.trunc(parent.clientWidth - parseFloat(paddingLeft) - parseFloat(paddingRight));
	}

	_computeHeight(data) {
		// TODO
		//const text = this.svg.select('text').node();
		//const parentStyle = window.getComputedStyle(text, null);
		//const fontSize = parseFloat(parentStyle.getPropertyValue('font-size'));
		if (!data) {
			return 60;
		}
		return 60;
	}

	update(data) {
		// remove all platforms & their projects
		this.svg.select('g').remove();
		// draw new platforms & their projects
		data.forEach((platform) => {
			this._drawPlatform(platform);
		});
		// adjust size
		this._setSize(data);
		this._drawTimeAxis();
	}

	_drawTimeAxis() {
		// TODO
		const dataAreaWidth = this._computeWidth() - PLATFORM_LIST_WIDTH - (DATA_AREA_PADDING_LEFT_RIGHT * 2);
		// adjust range first
		this.scale.range([0, dataAreaWidth]);
		// create time axis
		const axis = d3.axisTop().scale(this.scale);
		axis.tickFormat((date) => {
			// get the timestamp for the date + 1 day (to cover utc timezone offsets)
			const ts = new Date(date.getTime() + ONEDAY);
			// return appropriate quarter for the (zero-based) month
			switch (ts.getMonth()) {
				case 0: return ts.getFullYear();
				case 1: case 2: return 'Q1';
				case 3: case 4: case 5: return 'Q2';
				case 6: case 7: case 8: return 'Q3';
				default: return 'Q4';
			}
		});
		// append elements
		const drawArea = this.svg.append('g').attr('transform', 'translate(' + (PLATFORM_LIST_WIDTH + DATA_AREA_PADDING_LEFT_RIGHT) + ',' + 20 + ')');
		const timeAxis = drawArea.append('g').attr('class', 'time-axis');
		const ticks = timeAxis.append('g').attr('class', 'ticks').call(axis);
		timeAxis.selectAll('line.time-axis')
			.data(this.scale.ticks())
			.enter()
			.append('line')
				.attr('class', 'grid time-axis')
				.attr('x1', (date => { return this.scale(date); }))
				.attr('x2', (date => { return this.scale(date); }))
				.attr('y1', 0)
				// TODO this.lineHeight * this.data.length + this.bottomSpace
				.attr('y2', 50);
	}

	_drawPlatform(platform) {
		this._drawPlatformBox(platform.id, platform.name);
		platform.projects.forEach((project) => {
			this._drawProject(project);
		});
	}

	_drawPlatformBox(id, name) {
		// TODO
	}

	_drawProject(project) {
		// TODO
	}

	destroy() {
		if (this.svg) {
			// remove all listeners
			// TODO
			// remove svg element from DOM tree
			this.svg.remove();
			// clear refs
			this.svg = undefined;
		}
	}
}

export default D3ProjectRoadmap;