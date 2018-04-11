import * as d3 from 'd3';

// TODO https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model/Determining_the_dimensions_of_elements

class D3ProjectRoadmap {

	constructor(id, timeFrameStart, timeframeEnd) {
		this.id = id;
		this.timeFrame = {
			start: timeFrameStart,
			end: timeframeEnd
		};
		this._drawTimeAxis = this._drawTimeAxis.bind(this);
		this.update = this.update.bind(this);
		this._drawPlatform = this._drawPlatform.bind(this);
		this._drawPlatformBox = this._drawPlatformBox.bind(this);
		this._drawProject = this._drawProject.bind(this);
		this.destroy = this.destroy.bind(this);
		// init the chart & create all basic stuff
		this.svg = this._createSVG(id);
		this._drawTimeAxis();
		console.log(d3);
		console.log(this.svg);
	}

	_createSVG(id) {
		return d3.select('#' + id).append('svg');
	}

	_drawTimeAxis() {
		// TODO
	}

	update(data) {
		// remove all platforms & their projects
		// TODO
		// draw new platforms & their projects
		data.forEach((platform) => {
			this._drawPlatform(platform);
		});
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