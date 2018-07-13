import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Utilities from './common/leanix-reporting-utilities/Utilities';
import Label from './common/react-leanix-reporting/Label';
import Link from './common/react-leanix-reporting/Link';
import TableUtilities from './common/react-leanix-reporting/TableUtilities';

class Matrix extends Component {

	constructor(props) {
		super(props);
		this._renderNoData = this._renderNoData.bind(this);
		this._renderMatrix = this._renderMatrix.bind(this);
		this._renderRow = this._renderRow.bind(this);
		this._renderEmptyCell = this._renderEmptyCell.bind(this);
		this._renderCell = this._renderCell.bind(this);
		this._renderLabelLinkList = this._renderLabelLinkList.bind(this);
		this._renderLabelLink = this._renderLabelLink.bind(this);
	}

	render() {
		// filter out empty rows & columns if needed
		let data = [];
		if (this.props.showEmptyRows && this.props.showEmptyColumns) {
			// no need to do expensive copying
			data = this.props.data;
		} else {
			data = this.props.data.map((e) => {
				return Utilities.copyArray(e);
			});
			// data is structured in rows, so filter rows first
			if (!this.props.showEmptyRows) {
				for (let i = 1; i < data.length; i++) {
					const row = data[i];
					if (Utilities.isArrayEmpty(row, 1)) {
						data.splice(i, 1);
						i--;
					}
				}
			}
			// now filter columns
			if (!this.props.showEmptyColumns) {
				// there is always at least one row
				for (let i = 1; i < data[0].length; i++) {
					let keepColumn = false;
					for (let j = 1; j < data.length; j++) {
						const cell = data[j][i];
						keepColumn = keepColumn ? true : !Utilities.isArrayEmpty(cell, 0);
					}
					if (!keepColumn) {
						// remove column
						for (let j = 0; j < data.length; j++) {
							data[j].splice(i, 1);
						}
						i--;
					}
				}
			}
		}
		const baseUrl = Utilities.getFrom(this.props.setup, 'settings.baseUrl');
		return (
			<div className='matrix'>
				{!this.props.dataAvailable || data.length < 2 ? this._renderNoData(baseUrl) : this._renderMatrix(baseUrl, data)}
			</div>
		);
	}

	_renderNoData(baseUrl) {
		return (
			<h4 className='text-center' style={{ width: '100%' }}>No data available</h4>
		);
	}

	_renderMatrix(baseUrl, data) {
		return (
			<table>
				<tbody>
					{data.map((e, i) => {
						return this._renderRow(false, e, i, baseUrl);
					})}
				</tbody>
			</table>
		);
	}

	_renderRow(noData, row, rowIndex, baseUrl) {
		return (
			<tr key={rowIndex}>
				{row.map((e, i) => {
					if (noData) {
						if (rowIndex === 0 || i === 0) {
							// all header cells normally
							return this._renderCell(e, rowIndex, i, baseUrl);
						} else {
							// all other cells must be empty
							return this._renderEmptyCell(rowIndex, i);
						}
					}
					return this._renderCell(e, rowIndex, i, baseUrl);
				})}
			</tr>
		);
	}

	_renderEmptyCell(rowIndex, columnIndex) {
		return (
			<td key={rowIndex + '-' + columnIndex} />
		);
	}

	_renderCell(cell, rowIndex, columnIndex, baseUrl) {
		if (rowIndex === 0 && columnIndex === 0) {
			// first cell contains x & y axis labels
			return (
				<th key={rowIndex + '-' + columnIndex} className='matrix-labels small' style={{ minWidth: this.props.cellWidth }}>
					<div className='text-right' style={{ borderBottom: '1px solid black' }}>{cell[1]}</div>
					<div className='text-left'>{cell[0]}</div>
				</th>
			);
		}
		// headers are strings, data values are arrays
		if (Array.isArray(cell)) {
			return (
				<td key={rowIndex + '-' + columnIndex}>
					{this._renderLabelLinkList(cell, baseUrl)}
				</td>
			);
		} else {
			return (
				<th key={rowIndex + '-' + columnIndex}
					className='text-center' style={{ minWidth: this.props.cellWidth }}
					title={cell}>{cell}</th>
			);
		}
	}

	_renderLabelLinkList(list, baseUrl) {
		return (
			<div>
				{list.map((e, i) => {
					const link = baseUrl + '/factsheet/'
						+ this.props.factsheetType + '/' + e.id;
					return (
						<div key={i} className='text-center' style={{ marginBottom: '0.3em', lineHeight: '0' }}>
							<Label
								label={this._renderLabelLink(e.name, link)}
								bgColor={e.colors.bgColor}
								color={e.colors.color}
								width='100%'
							/>
						</div>
					);
				})}
			</div>
		);
	}

	_renderLabelLink(text, link) {
		return () => {
			return (
				<Link link={link} target='_blank' text={text} />
			);
		}
	}
}

Matrix.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.arrayOf(
			PropTypes.oneOfType([
				PropTypes.arrayOf(PropTypes.string.isRequired),
				PropTypes.string,
				PropTypes.arrayOf(
					PropTypes.shape({
						id: PropTypes.string.isRequired,
						name: PropTypes.string.isRequired,
						colors: PropTypes.shape({
							color: PropTypes.string.isRequired,
							bgColor: PropTypes.string.isRequired
						}).isRequired
					}).isRequired
				)
			]).isRequired
		).isRequired
	).isRequired,
	dataAvailable: PropTypes.bool.isRequired,
	cellWidth: PropTypes.string.isRequired,
	factsheetType: PropTypes.string.isRequired,
	showEmptyRows: PropTypes.bool.isRequired,
	showEmptyColumns: PropTypes.bool.isRequired,
	setup: PropTypes.object.isRequired
};

export default Matrix;