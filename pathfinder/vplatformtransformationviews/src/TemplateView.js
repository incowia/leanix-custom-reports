import React, { Component } from 'react';
import PropTypes from 'prop-types';

const DASHED_BORDER = '2px dashed grey';
const CONTAINER_BLOCK_CSS_CLASS = 'text-center text-muted';
const BLOCK_HEIGHT = '5.5em';

class TemplateView extends Component {

	constructor(props) {
		super(props);
	}

	_createRenderItems(items) {
		return items.reduce((acc, e, i) => {
			const threeInLine = i % 3;
			let currentLine = [];
			if (threeInLine === 0) {
				// begin new line
				acc.push(currentLine);
			} else {
				currentLine = acc[acc.length - 1];
			}
			currentLine.push(e);
			return acc;
		}, []);
	}

	render() {
		return (
			<div className='container'>
				<div className='row'>
					<div className='col-md-3'>
						<div className='well well-sm' style={{
							height: BLOCK_HEIGHT,
							visibility: 'hidden'
						}}>
							dummy for position
						</div>
						{this._renderSideArea()}
					</div>
					<div className='col-md-6'>
						{this._renderMainArea()}
					</div>
					<div className='col-md-3'>
						{this._renderLegend()}
					</div>
				</div>
			</div>
		);
	}

	_renderSideArea() {
		return (
			<div className='well well-sm' style={{
				border: DASHED_BORDER,
				background: 'white'
			}}>
				{this._renderContainerHeading(this.props.sideArea.name)}
				{this.props.sideArea.items.map((item) => {
					return this._renderSideAreaItem(item);
				})}
			</div>
		);
	}

	_renderContainerHeading(name) {
		return (
			<p className={CONTAINER_BLOCK_CSS_CLASS}>
				{name}
			</p>
		);
	}

	_renderSideAreaItem(item) {
		const style = {
			background: this.props.colorScheme.getColor(item.id, 0),
			height: BLOCK_HEIGHT,
			marginBottom: '10px'
		};
		return this._renderBlock(item, style);
	}

	_renderBlock(item, style) {
		return (
			<div key={item.id} className='well well-sm text-center small' style={style}>
				<div style={{
					padding: '0px 2.5em',
					position: 'relative',
					top: '50%',
					transform: 'translateY(-50%)'
				}}>
					<b>{item.name}</b>
					{this.props.additionalContent && this.props.additionalContent(item.id)}
				</div>
			</div>
		);
	}

	_renderMainArea() {
		return (
			<div>
				{this.props.mainArea.map((e, i) => {
					return this._renderMainBlock(e, i, i === this.props.mainArea.length - 1);
				})}
			</div>
		);
	}

	_renderMainBlock(block, pos, lastBlock) {
		switch (block.items.length) {
			case 0:
				return null;
			case 1:
				if (lastBlock) {
					// last element should not have 'integration' afterwards
					return this._renderItems(block.id, block.items, false, true, 0);
				}
				return [
					this._renderItems(block.id, block.items, false, true, 0),
					this._renderItems(this.props.mainIntermediateArea.id, [this.props.mainIntermediateArea], true, false, pos)
				];
			default:
				if (lastBlock) {
					// last element should not have 'integration' afterwards
					return this._renderFilledMainBlock(block);
				}
				return [
					this._renderFilledMainBlock(block),
					this._renderItems(this.props.mainIntermediateArea.id, [this.props.mainIntermediateArea], true, false, pos)
				];
		}
	}

	_renderFilledMainBlock(block) {
		return (
			<div key={block.id} className='well well-sm' style={{
				background: 'white',
				margin: '-1.25em 0px -0.5em 0px',
				borderColor: 'red',
				position: 'relative',
				zIndex: '0'
			}}>
				{this._renderContainerHeading(block.name)}
				{this._renderItems(block.id, block.items, false, false, 0)}
			</div>
		);
	}

	_renderItems(id, items, shouldBeSmall, dashedBorder, pos) {
		if (items.length === 1) {
			return (
				<table key={id} style={{
					width: shouldBeSmall ? '96%' : '100%',
					margin: '0px auto',
					position: 'relative',
					zIndex: '100'
				}}>
					<tbody>
						<tr>
							{this._renderItem(items[0], 1, true, shouldBeSmall, dashedBorder, pos)}
						</tr>
					</tbody>
				</table>
			);
		}
		const renderItems = this._createRenderItems(items);
		return (
			<table key={id} style={{
				width: '100%',
				margin: '0px auto'
			}}>
				<tbody>
					{renderItems.map((line, i) => {
						return (
							<tr key={i}>
								{line.map((item, i) => {
									return this._renderItem(item, line.length, i === line.length - 1, shouldBeSmall, dashedBorder, pos);
								})}
							</tr>
						);
					})}
				</tbody>
			</table>
		);
	}

	_renderItem(item, columnCount, lastItemInLine, shouldBeSmall, dashedBorder, pos) {
		const style = {
			background: this.props.colorScheme.getColor(item.id, pos),
			height: shouldBeSmall ? '1.5em' : BLOCK_HEIGHT,
			marginBottom: '10px'
		};
		if (dashedBorder) {
			style.border = DASHED_BORDER;
		}
		return (
			<td key={item.id} colSpan={4 - columnCount} style={{ paddingRight: columnCount > 0 && !lastItemInLine ? '10px' : '' }}>
				{this._renderBlock(item, style)}
			</td>
		);
	}

	_renderLegend() {
		return (
			<div>
				<h3>Keys</h3>
				<dl className='dl-horizontal'>
					{this.props.legend.map((e) => {
						return this._renderLegendItem(e);
					})}
				</dl>
			</div>
		);
	}

	_renderLegendItem(e) {
		return [(
			<dt key={e.color + '_dt'} style={{ width: 'auto' }}>
				<span className='label'
					style={{
						display: 'inline-block',
						width: '1.6em',
						height: '1.5em',
						verticalAlign: '-30%',
						backgroundColor: e.color,
						border: '1px solid black'
					 }} />
			</dt>
		), (
			<dd key={e.color + '_dd'} style={{ marginLeft: '2em' }}>
				{e.text}
			</dd>
		)];
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
