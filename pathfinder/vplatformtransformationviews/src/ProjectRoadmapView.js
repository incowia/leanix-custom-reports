import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Wrapper from './common/Wrapper';
import D3ProjectRoadmap from './D3ProjectRoadmap';
import ViewUtils from './ViewsUtilities';

const COMPONENT_ID = 'project-roadmap-view';

class ProjectRoadmapView extends Component {

	constructor(props) {
		super(props);
		this._updateInstance = this._updateInstance.bind(this);
		this._normalizeData = this._normalizeData.bind(this);
		this._handleOnMount = this._handleOnMount.bind(this);
		this._handleResize = this._handleResize.bind(this);
		this._handleOnWillUnmount = this._handleOnWillUnmount.bind(this);
		this.wrapper = React.createRef();
	}

	_updateInstance() {
		if (!this.props.showData) {
			// no need to update, no data should be shown
			return;
		}
		const wrapperComponent = this.wrapper.current;
		if (!wrapperComponent) {
			// no need to update, there is no component to update
			return;
		}
		// visibility is managed in this component, so just update the data
		const wrapperState = wrapperComponent.getInnerState();
		wrapperState.instance.update(this._normalizeData(this.props.data));
	}

	_normalizeData(data) {
		// normalize the data by align the projects with the timeframe (the view port)
		return data.map((platform) => {
			const normalizedPlatform = {
				id: platform.id,
				name: platform.name,
				projects: []
			};
			// normalize projects
			platform.projects.forEach((project) => {
				const viewPort = this._computeViewPort(project.start, project.end);
				if (!viewPort.doDraw) {
					// outside of the timeframe, therefore not needed
					return;
				}
				normalizedPlatform.projects.push({
					id: project.id,
					data: {
						name: project.name,
						start: project.start,
						end: project.end,
						// TODO just the number?
						csmApis: project.csmApis
					},
					viewPort: {
						start: viewPort.start,
						end: viewPort.end
					}
				});
			});
		});
	}

	_computeViewPort(start, end) {
		let viewPortStart = start;
		if (start < ViewUtils.CURRENT_DATE_TIME) {
			viewPortStart = ViewUtils.CURRENT_DATE_TIME;
		} else if (start >= ViewUtils.TODAY_PLUS_3_YEARS_TIME) {
			viewPortStart = undefined;
		}
		let viewPortEnd = end;
		if (!end || end > ViewUtils.TODAY_PLUS_3_YEARS_TIME) {
			viewPortEnd = ViewUtils.TODAY_PLUS_3_YEARS_TIME;
		}
		return {
			doDraw: viewPortStart !== undefined,
			start: viewPortStart,
			end: !viewPortStart ? undefined : viewPortEnd
		};
	}

	_handleOnMount(config, div) {
		// add listeners
		window.addEventListener('resize', this._handleResize);
		// create the nested D3-based component
		const instance = new D3ProjectRoadmap(config.id, ViewUtils.CURRENT_DATE_TIME, ViewUtils.TODAY_PLUS_3_YEARS_TIME);
		// call update immediately, since 'componentDidUpdate' won't be called after mounting
		instance.update(this._normalizeData(this.props.data));
		// store the instance in the 'inner state' object of the wrapper
		return {
			instance: instance
		};
	}

	_handleResize() {
		this._updateInstance();
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (this.props.showData !== nextProps.showData) {
			return true;
		}
		// rendering a chart is expensive, so just do the update call in 'componentDidUpdate' if needed
		const currentData = this.props.data;
		const nextData = nextProps.data;
		if (currentData.length !== nextData.length) {
			return true;
		}
		return currentData.some((currentPlatform, i) => {
			// check if positions and/or platform ids changed
			const nextPlatform = nextData[i];
			if (currentPlatform.id !== nextPlatform.id) {
				return true;
			}
			// check projects
			return currentPlatform.projects.some((currentProject, j) => {
				const nextProject = nextPlatform.projects[j];
				// check if positions and/or project ids changed
				if (currentProject.id !== nextProject.id) {
					return true;
				}
				// check other properties
				return currentProject.start !== nextProject.start
					|| currentProject.end !== nextProject.end
					|| currentProject.csmApis !== nextProject.csmApis;
			});
		});
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		this._updateInstance();
	}

	_handleOnWillUnmount(config, state, div) {
		// remove listeners
		window.removeEventListener('resize', this._handleResize);
		// destroy the nested D3-based component
		state.instance.destroy();
	}

	render() {
		// TODO uncomment
		if (!this.props.showData /* || this.props.data.length === 0 */) {
			return (<h4 className='text-center'>There is no data available.</h4>);
		}
		return (
			<Wrapper ref={this.wrapper}
				id={COMPONENT_ID}
				onMount={this._handleOnMount}
				onWillUnmount={this._handleOnWillUnmount} />
		);
	}
}

ProjectRoadmapView.propTypes = {
	showData: PropTypes.bool.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			// platform
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			projects: PropTypes.arrayOf(
				PropTypes.shape({
					id: PropTypes.string.isRequired,
					name: PropTypes.string.isRequired,
					start: PropTypes.number.isRequired,
					end: PropTypes.number,
					// TODO welche csms?
					csmApis: PropTypes.number
				}).isRequired
			).isRequired
		}).isRequired
	).isRequired
};

export default ProjectRoadmapView;
