import React, { Component } from 'react';
import PropTypes from 'prop-types';


class TemplateView extends Component {

	constructor(props) {
		super(props);
		this._renderMainArea = this._renderMainArea.bind(this);
		this._renderBlocks = this._renderBlocks.bind(this);
		this._renderLegend = this._renderLegend.bind(this);
	}

	render() {
		return (
			<div className="container">
				<div className="row">
					<div className="col-md-3">
						{this._renderBlocks(this.props.sideArea.id, this.props.sideArea.name, this.props.sideArea.items)}
					</div>
					<div className="col-md-6">
						{this._renderMainArea()}
					</div>
					<div className="col-md-3">
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

	_renderBlockInline(id, name) {
		const divStyle = {
			textAlign: 'center',
			float: 'left',
			width: '30%',
			margin: '2px'
		}
		return (
			<div key={id} className="well well-sm" style={divStyle}>
				{name}
			</div>
		);
	}

	_renderBlocks(id, name, items) {
		return (
			<div key={id} className="well well-sm" style={{overflow: 'hidden'}}>
				{name}
				<br/>
				{items.map((e) => {
					return this._renderBlockInline(e.id, e.name);
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

	_renderLegend() {
		return (
			<div>
				<h3>Keys</h3>
				{this.props.legend.map((e) => {
					return this._renderLegendItem(e);
				})}
			</div>
		);
	}

	_renderLegendItem(e) {
		let border = '';
		if (e.color === 'white') {
			border = '1px solid black';
		}
		return (
			<p key={e.color}
			 style={{
			 	whiteSpace: 'nowrap'
			 }}>
				<span className='label'
					style={{
						display: 'inline-block',
						width: '1.6em',
						height: '1.5em',
						verticalAlign: '-30%',
						backgroundColor: e.color,
						border: border
					 }} />
				<span style={{
					marginLeft: '0.3em'
				}}>{e.text}</span>
			</p>
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
