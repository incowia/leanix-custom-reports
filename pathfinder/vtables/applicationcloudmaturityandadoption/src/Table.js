import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
		this.currentFY = this.props.currentFYear % 100; // two-digit year

		this._formatRule = this._formatRule.bind(this);
		this._renderYearCountsColumn = this._renderYearCountsColumn.bind(this);
		this._renderYearAppsColumn = this._renderYearAppsColumn.bind(this);
		this._renderColumnTitle = this._renderColumnTitle.bind(this);
	}

	_formatRule(cell, row, enums) {
		const text = TableUtilities.formatEnum(cell, row, enums);
		const additionalNote = this.props.additionalNotes[text];
		if (additionalNote) {
			const marker = additionalNote.marker + 1;
			return text + ' <sup><b>[' + marker + ']</b></sup>';
		}
		return text;
	}

	_formatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		return (
			<span className='cell'>{(row.isPercentage ? cell + ' %' : cell)}</span>
		);
	}

	_csvFormatNumber(cell, row) {
		if (cell === undefined || cell === null || Number.isNaN(cell)) {
			return '';
		}
		return cell;
	}

	_trClassname(row, fieldValue, rowIdx, colIdx) {
		if (row.overallRule) {
			return 'info';
		}
	}

	_renderYearCountsColumn(yearOffset) {
		// number type parameters will be preceeded by 'fy', otherwise it's the 'current' column
		const fiscalYear = isNaN(yearOffset) ? 'current' : 'fy' + yearOffset;
		return (
			<TableHeaderColumn columnClassName={'year ' + fiscalYear}
				dataField={fiscalYear}
				dataAlign='right'
				headerAlign='left'
				dataFormat={this._formatNumber}
				csvHeader={(isNaN(yearOffset) ? 'current' : 'fy-' + (this.currentFY + yearOffset) + '/' + (this.currentFY + yearOffset + 1))}
				csvFormat={this._csvFormatNumber}
				>{this._renderColumnTitle(yearOffset)}
			</TableHeaderColumn>
		);
	}

	_renderYearAppsColumn(yearOffset) {
		// number type parameters will be preceeded by 'fy', otherwise it's the 'current' column
		const fiscalYear = isNaN(yearOffset) ? 'current' : 'fy' + yearOffset;
		return (
			<TableHeaderColumn hidden export columnClassName={'year apps ' + fiscalYear}
				dataField={fiscalYear + '_Apps'}
				csvHeader={(isNaN(yearOffset) ? 'current' : 'fy-' + (this.currentFY + yearOffset) + '/' + (this.currentFY + yearOffset + 1)) + '-apps'}
				csvFormat={TableUtilities.formatArray}
				csvFormatExtraData=';'
				>{this._renderColumnTitle(yearOffset) + ' - Applications'}
			</TableHeaderColumn>
		);
	}

	_renderColumnTitle(yearOffset) {
		return (
			isNaN(yearOffset) ? 'Current' : 'FY ' + (this.currentFY + yearOffset) + '/' + (this.currentFY + yearOffset + 1)
		);
	}
	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				striped hover exportCSV condensed
				pagination
				options={{
					sizePerPage: this.props.pageSize,
					hideSizePerPage: true
				}}
				trClassName={this._trClassname}>
				<TableHeaderColumn dataSort columnClassName='market'
					dataField='market'
					width='80px'
					dataAlign='left'
					dataFormat={TableUtilities.formatEnum}
					formatExtraData={this.props.options.market}
					csvFormat={TableUtilities.formatEnum}
					csvFormatExtraData={this.props.options.market}
					filter={TableUtilities.selectFilter(this.props.options.market)}
					>Market</TableHeaderColumn>
				<TableHeaderColumn dataSort columnClassName='small rule'
					dataField='rule'
					width='400px'
					dataAlign='left'
					dataFormat={this._formatRule}
					formatExtraData={this.props.options.rule}
					csvFormat={TableUtilities.formatEnum}
					csvFormatExtraData={this.props.options.rule}
					filter={TableUtilities.selectFilter(this.props.options.rule)}
					>Rule</TableHeaderColumn>
				{this._renderYearCountsColumn()}
				{this._renderYearAppsColumn()}
				{this._renderYearCountsColumn(0)}
				{this._renderYearAppsColumn(0)}
				{this._renderYearCountsColumn(1)}
				{this._renderYearAppsColumn(1)}
				{this._renderYearCountsColumn(2)}
				{this._renderYearAppsColumn(2)}
				{this._renderYearCountsColumn(3)}
				{this._renderYearAppsColumn(3)}
				{this._renderYearCountsColumn(4)}
				{this._renderYearAppsColumn(4)}
				{this._renderYearCountsColumn(5)}
				{this._renderYearAppsColumn(5)}
			</BootstrapTable>
		);
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			market: PropTypes.number.isRequired,
			rule: PropTypes.number.isRequired,
			overallRule: PropTypes.bool,
			isPercentage: PropTypes.bool.isRequired,
			current: PropTypes.number.isRequired,
			current_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0: PropTypes.number.isRequired,
			fy0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0: PropTypes.number.isRequired,
			fy0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1: PropTypes.number.isRequired,
			fy1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2: PropTypes.number.isRequired,
			fy2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3: PropTypes.number.isRequired,
			fy3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4: PropTypes.number.isRequired,
			fy4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5: PropTypes.number.isRequired,
			fy5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	currentFYear: PropTypes.number.isRequired,
	additionalNotes: PropTypes.object.isRequired,
	options: PropTypes.shape({
		market: TableUtilities.PropTypes.options,
		rule: TableUtilities.PropTypes.options,
	}).isRequired,
	pageSize: PropTypes.number.isRequired,
	setup: PropTypes.object
};

export default Table;