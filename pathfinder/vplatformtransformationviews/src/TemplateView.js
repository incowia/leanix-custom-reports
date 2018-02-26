import React, { Component } from 'react';
import PropTypes from 'prop-types';


class TemplateView extends Component {

	constructor(props) {
		super(props);
		this._renderMainArea = this._renderMainArea.bind(this);
		this._renderBlocks = this._renderBlocks.bind(this);
	}

	render() {
		return (
			<div className="container">
				<div className="row">
					<div className="col-md-2">
						{this._renderBlocks(this.props.sideArea.id, this.props.sideArea.name, this.props.sideArea.items)}
					</div>
					<div className="col-md-8">
						{this._renderMainArea()}
					</div>
					<div className="col-md-2">
						{this._renderLegend()}
					</div>
				</div>
			</div>
		);
	}

	_renderBlock(id, name) {
		return (
			<div key={id} className="well well-sm" style={{textAlign: 'center'}}>
				{name}
			</div>
		);
	}

	_renderBlocks(id, name, items) {
		return (
			<div key={id} className="well well-sm">
				{name}
				{items.map((e) => {
					return this._renderBlock(e.id, e.name);
				})}
			</div>
		);
	}

	_renderMainArea() {
		return (
			<div>
				{this.props.mainArea.map((e, i) => {
					switch (e.items.length) {
						case 0:
							return null;
						case 1:
							return [
								this._renderBlock(e.items[0].id, e.items[0].name),
								this._renderBlock(this.props.mainIntermediateArea.id, this.props.mainIntermediateArea.name)
							];
						default:
							if (i + 1 === this.props.mainArea.length) {
								return this._renderBlocks(e.id, e.name, e.items);
							}
							return [
								this._renderBlocks(e.id, e.name, e.items),
								this._renderBlock(this.props.mainIntermediateArea.id, this.props.mainIntermediateArea.name)
							];
					}
				})}
			</div>
		);
	}

	_renderLegendBoxs () {
		return(
			this.props.legend.map((e) => {
				return this._renderLegendBox(e.text, e.color);
		}));
	}

	_renderLegendBox(label, color) {
		const divStyle = {
			backgroundColor : color,
			display: 'inline-block',
			height: '30px',
			width: '30px',
			border: '1px solid black'
		};
		return(
			<div>
				<div style={divStyle}></div>
				<span style={{margin: '1em'}}>{label}</span>
			</div>
		);
	}

	_renderLegend() {
		return(
			<div>Key
				{this._renderLegendBoxs()}
			</div>
		);
	}
}

TemplateView.propTypes = {
	sideArea: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		items: PropTypes.arrayOf(
			PropTypes.shape({
				id: PropTypes.string.isRequired,
				name: PropTypes.string.isRequired
			}).isRequired
		).isRequired
	}).isRequired,
	mainArea: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			items: PropTypes.arrayOf(
				PropTypes.shape({
					id: PropTypes.string.isRequired,
					name: PropTypes.string.isRequired
				}).isRequired
			).isRequired
		}).isRequired
	).isRequired,
	mainIntermediateArea: PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired
	}).isRequired,
	legend: PropTypes.arrayOf(
		PropTypes.shape({
			color: PropTypes.string.isRequired,
			text: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	colorScheme: PropTypes.object.isRequired,
	additionalContent: PropTypes.func
};

export default TemplateView;
