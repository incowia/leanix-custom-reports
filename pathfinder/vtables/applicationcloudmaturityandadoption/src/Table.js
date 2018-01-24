import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './common/TableUtilities';

const FISCAL_MONTH = [
		{ id: 0, shortName : 'Apr', longName: 'April' },
		{ id: 1, shortName : 'May', longName: 'May' },
		{ id: 2, shortName : 'Jun', longName: 'June' },
		{ id: 3, shortName : 'Jul', longName: 'July' },
		{ id: 4, shortName : 'Aug', longName: 'August' },
		{ id: 5, shortName : 'Sep', longName: 'September' },
		{ id: 6, shortName : 'Oct', longName: 'October' },
		{ id: 7, shortName : 'Nov', longName: 'November' },
		{ id: 8, shortName : 'Dec', longName: 'December' },
		{ id: 9, shortName : 'Jan', longName: 'January' },
		{ id: 10, shortName : 'Feb', longName: 'February' },
		{ id: 11, shortName : 'Mar', longName: 'March' }
	];

class Table extends Component {

	constructor(props) {
		super(props);
		this._formatRule = this._formatRule.bind(this);
		this._handleYearColumnClick = this._handleYearColumnClick.bind(this);
		this._renderYearColumnTitle = this._renderYearColumnTitle.bind(this);
		this._renderMonthColumnTitle = this._renderMonthColumnTitle.bind(this);
		this.state = {
			fyExpanded: [0,0,0,0,0,0]
		};
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
			<div>
				<span style={{
					display: 'inline-block',
					width: '100%',
					margin: '2px',
					textAlign: 'right'
				}}>{(row.isPercentage ? cell + ' %' : cell)}</span>
			</div>
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
		return '';
	}

	_renderYearColumnTitle(year, offset) {
		const className = 'clickable glyphicon glyphicon-arrow-' + (this.state.fyExpanded[offset] ? 'left' : 'right');
		return (
			<span>
				<span
					className={className}
					aria-hidden="true"
					aria-label="expand fiscal year"
					title={this.state.fyExpanded[offset] ? 'collapse fiscal year' : 'expand fiscal year'}
					data-fy={offset}
					data-state={this.state.fyExpanded[offset]}
					onClick={this._handleYearColumnClick}/>
				<span className='header-title'>FY {year + offset}/{year + offset + 1}</span>
			</span>
		);
	}

	_handleYearColumnClick(event) {
		const sender = event.target || event.srcElement;
		if (!sender) {
			return;
		}
		const fy = sender.getAttribute('data-fy');
		const state = sender.getAttribute('data-state');
		let fyExpanded = this.state.fyExpanded;
		if (this.props.options.multiExpand === true) {
			fyExpanded[fy] = 1 - fyExpanded[fy];
		} else {
			fyExpanded = fyExpanded.map((e, i) => {
				return (i == fy ? 1 - state : 0);
			});
		}
		this.setState({
			fyExpanded: fyExpanded
		});
	}

	_renderMonthColumnTitle(monthOffset, yearOffset, suffix) {
		// 9 is offset of month January
		return (
			<span className='month'>
				{FISCAL_MONTH[monthOffset].shortName}<br/>
				{(monthOffset < 9 ? this.props.currentFYear : this.props.currentFYear + 1) + yearOffset}
				{suffix || ''}
			</span>
		);
	}

	render() {
		const financialYear = this.props.currentFYear % 100;
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				 striped hover exportCSV condensed
				 pagination
				 options={{
					sizePerPage: this.props.pageSize,
					hideSizePerPage: true
				 }}
				 trClassName={this._trClassname}>
				<TableHeaderColumn dataSort columnClassName='small market'
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
				<TableHeaderColumn columnClassName='small current'
					dataField='current'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader='current'
					csvFormat={this._csvFormatNumber}
					>Current</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='current_Apps'
					csvHeader={'current-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>Current - Applications</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy0'
					dataField='fy0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + financialYear + '/' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_Apps'
					csvHeader={'fy-' + financialYear + '/' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear}/{financialYear + 1} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_0_Apps'
					csvHeader={'Apr-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_1_Apps'
					csvHeader={'May-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_2_Apps'
					csvHeader={'Jun-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_3_Apps'
					csvHeader={'Jul-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_4_Apps'
					csvHeader={'Aug-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_5_Apps'
					csvHeader={'Sep-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_6_Apps'
					csvHeader={'Oct-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_7_Apps'
					csvHeader={'Nov-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_8_Apps'
					csvHeader={'Dec-' + financialYear + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_9_Apps'
					csvHeader={'Jan-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + financialYear}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_10_Apps'
					csvHeader={'Feb-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 0, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[0] === 0}
					columnClassName='small month fy0'
					dataField='fy0_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 0)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy0_11_Apps'
					csvHeader={'Mar-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 0, ' - Applications')}</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy1'
					dataField='fy1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + (financialYear + 1) + '/' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_Apps'
					csvHeader={'fy-' + (financialYear + 1) + '/' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear + 1}/{financialYear + 2} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_0_Apps'
					csvHeader={'Apr-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_1_Apps'
					csvHeader={'May-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_2_Apps'
					csvHeader={'Jun-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_3_Apps'
					csvHeader={'Jul-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_4_Apps'
					csvHeader={'Aug-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_5_Apps'
					csvHeader={'Sep-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_6_Apps'
					csvHeader={'Oct-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_7_Apps'
					csvHeader={'Nov-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + (financialYear + 1)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_8_Apps'
					csvHeader={'Dec-' + (financialYear + 1) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_9_Apps'
					csvHeader={'Jan-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_10_Apps'
					csvHeader={'Feb-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 1, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[1] === 0}
					columnClassName='small month fy1'
					dataField='fy1_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 1)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy1_11_Apps'
					csvHeader={'Mar-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 1, ' - Applications')}</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy2'
					dataField='fy2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + (financialYear + 2) + '/' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_Apps'
					csvHeader={'fy-' + (financialYear + 2) + '/' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear + 2}/{financialYear + 3} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_0_Apps'
					csvHeader={'Apr-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_1_Apps'
					csvHeader={'May-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_2_Apps'
					csvHeader={'Jun-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_3_Apps'
					csvHeader={'Jul-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_4_Apps'
					csvHeader={'Aug-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_5_Apps'
					csvHeader={'Sep-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_6_Apps'
					csvHeader={'Oct-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_7_Apps'
					csvHeader={'Nov-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + (financialYear + 2)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_8_Apps'
					csvHeader={'Dec-' + (financialYear + 2) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_9_Apps'
					csvHeader={'Jan-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_10_Apps'
					csvHeader={'Feb-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 2, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[2] === 0}
					columnClassName='small month fy2'
					dataField='fy2_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 2)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy2_11_Apps'
					csvHeader={'Mar-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 2, ' - Applications')}</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy3'
					dataField='fy3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + (financialYear + 3) + '/' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_Apps'
					csvHeader={'fy-' + (financialYear + 3) + '/' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear + 3}/{financialYear + 4} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_0_Apps'
					csvHeader={'Apr-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_1_Apps'
					csvHeader={'May-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_2_Apps'
					csvHeader={'Jun-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_3_Apps'
					csvHeader={'Jul-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_4_Apps'
					csvHeader={'Aug-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_5_Apps'
					csvHeader={'Sep-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_6_Apps'
					csvHeader={'Oct-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_7_Apps'
					csvHeader={'Nov-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_8_Apps'
					csvHeader={'Dec-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_9_Apps'
					csvHeader={'Jan-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_10_Apps'
					csvHeader={'Feb-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 3, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[3] === 0}
					columnClassName='small month fy3'
					dataField='fy3_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 3)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy3_11_Apps'
					csvHeader={'Mar-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 3, ' - Applications')}</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy4'
					dataField='fy4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + (financialYear + 4) + '/' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_Apps'
					csvHeader={'fy-' + (financialYear + 4) + '/' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear + 4}/{financialYear + 5} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_0_Apps'
					csvHeader={'Apr-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_1_Apps'
					csvHeader={'May-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_2_Apps'
					csvHeader={'Jun-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_3_Apps'
					csvHeader={'Jul-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_4_Apps'
					csvHeader={'Aug-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_5_Apps'
					csvHeader={'Sep-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_6_Apps'
					csvHeader={'Oct-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_7_Apps'
					csvHeader={'Nov-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + (financialYear + 3)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_8_Apps'
					csvHeader={'Dec-' + (financialYear + 3) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_9_Apps'
					csvHeader={'Jan-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_10_Apps'
					csvHeader={'Feb-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 4, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[4] === 0}
					columnClassName='small month fy4'
					dataField='fy4_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 4)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 4)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy4_11_Apps'
					csvHeader={'Mar-' + (financialYear + 4) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 4, ' - Applications')}</TableHeaderColumn>

				<TableHeaderColumn columnClassName='small year fy5'
					dataField='fy5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'fy-' + (financialYear + 5) + '/' + (financialYear + 6)}
					csvFormat={this._csvFormatNumber}
					>{this._renderYearColumnTitle(financialYear, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_Apps'
					csvHeader={'fy-' + (financialYear + 5) + '/' + (financialYear + 6) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>FY {financialYear + 5}/{financialYear + 6} - Applications</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_0'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Apr-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(0, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_0_Apps'
					csvHeader={'Apr-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(0, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_1'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'May-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(1, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_1_Apps'
					csvHeader={'May-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(1, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_2'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jun-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(2, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_2_Apps'
					csvHeader={'Jun-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(2, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_3'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jul-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(3, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_3_Apps'
					csvHeader={'Jul-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(3, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_4'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Aug-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(4, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_4_Apps'
					csvHeader={'Aug-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(4, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_5'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Sep-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(5, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_5_Apps'
					csvHeader={'Sep-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(5, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_6'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Oct-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(6, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_6_Apps'
					csvHeader={'Oct-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(6, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_7'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Nov-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(7, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_7_Apps'
					csvHeader={'Nov-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(7, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_8'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Dec-' + (financialYear + 5)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(8, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_8_Apps'
					csvHeader={'Dec-' + (financialYear + 5) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(8, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_9'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Jan-' + (financialYear + 6)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(9, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_9_Apps'
					csvHeader={'Jan-' + (financialYear + 6) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(9, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_10'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Feb-' + (financialYear + 6)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(10, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_10_Apps'
					csvHeader={'Feb-' + (financialYear + 6) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(10, 5, ' - Applications')}</TableHeaderColumn>
				<TableHeaderColumn export
					hidden={this.state.fyExpanded[5] === 0}
					columnClassName='small month fy5'
					dataField='fy5_11'
					dataAlign='right'
					headerAlign='left'
					dataFormat={this._formatNumber}
					csvHeader={'Mar-' + (financialYear + 6)}
					csvFormat={this._csvFormatNumber}
					>{this._renderMonthColumnTitle(11, 5)}</TableHeaderColumn>
				<TableHeaderColumn hidden export
					dataField='fy5_11_Apps'
					csvHeader={'Mar-' + (financialYear + 6) + '-apps'}
					csvFormat={TableUtilities.formatArray}
					csvFormatExtraData=';'
					>{this._renderMonthColumnTitle(11, 5, ' - Applications')}</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

/*
If 'multiExpand' option is true,
then the months of more than one fiscal year can be expanded,
otherwise only the months of a single fiscal year can be expanded.
*/

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
			fy0_0: PropTypes.number.isRequired,
			fy0_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_1: PropTypes.number.isRequired,
			fy0_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_2: PropTypes.number.isRequired,
			fy0_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_3: PropTypes.number.isRequired,
			fy0_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_4: PropTypes.number.isRequired,
			fy0_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_5: PropTypes.number.isRequired,
			fy0_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_6: PropTypes.number.isRequired,
			fy0_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_7: PropTypes.number.isRequired,
			fy0_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_8: PropTypes.number.isRequired,
			fy0_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_9: PropTypes.number.isRequired,
			fy0_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_10: PropTypes.number.isRequired,
			fy0_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy0_11: PropTypes.number.isRequired,
			fy0_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

			fy1: PropTypes.number.isRequired,
			fy1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_0: PropTypes.number.isRequired,
			fy1_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_1: PropTypes.number.isRequired,
			fy1_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_2: PropTypes.number.isRequired,
			fy1_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_3: PropTypes.number.isRequired,
			fy1_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_4: PropTypes.number.isRequired,
			fy1_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_5: PropTypes.number.isRequired,
			fy1_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_6: PropTypes.number.isRequired,
			fy1_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_7: PropTypes.number.isRequired,
			fy1_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_8: PropTypes.number.isRequired,
			fy1_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_9: PropTypes.number.isRequired,
			fy1_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_10: PropTypes.number.isRequired,
			fy1_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy1_11: PropTypes.number.isRequired,
			fy1_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

			fy2: PropTypes.number.isRequired,
			fy2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_0: PropTypes.number.isRequired,
			fy2_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_1: PropTypes.number.isRequired,
			fy2_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_2: PropTypes.number.isRequired,
			fy2_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_3: PropTypes.number.isRequired,
			fy2_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_4: PropTypes.number.isRequired,
			fy2_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_5: PropTypes.number.isRequired,
			fy2_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_6: PropTypes.number.isRequired,
			fy2_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_7: PropTypes.number.isRequired,
			fy2_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_8: PropTypes.number.isRequired,
			fy2_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_9: PropTypes.number.isRequired,
			fy2_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_10: PropTypes.number.isRequired,
			fy2_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy2_11: PropTypes.number.isRequired,
			fy2_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

			fy3: PropTypes.number.isRequired,
			fy3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_0: PropTypes.number.isRequired,
			fy3_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_1: PropTypes.number.isRequired,
			fy3_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_2: PropTypes.number.isRequired,
			fy3_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_3: PropTypes.number.isRequired,
			fy3_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_4: PropTypes.number.isRequired,
			fy3_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_5: PropTypes.number.isRequired,
			fy3_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_6: PropTypes.number.isRequired,
			fy3_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_7: PropTypes.number.isRequired,
			fy3_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_8: PropTypes.number.isRequired,
			fy3_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_9: PropTypes.number.isRequired,
			fy3_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_10: PropTypes.number.isRequired,
			fy3_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy3_11: PropTypes.number.isRequired,
			fy3_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

			fy4: PropTypes.number.isRequired,
			fy4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_0: PropTypes.number.isRequired,
			fy4_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_1: PropTypes.number.isRequired,
			fy4_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_2: PropTypes.number.isRequired,
			fy4_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_3: PropTypes.number.isRequired,
			fy4_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_4: PropTypes.number.isRequired,
			fy4_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_5: PropTypes.number.isRequired,
			fy4_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_6: PropTypes.number.isRequired,
			fy4_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_7: PropTypes.number.isRequired,
			fy4_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_8: PropTypes.number.isRequired,
			fy4_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_9: PropTypes.number.isRequired,
			fy4_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_10: PropTypes.number.isRequired,
			fy4_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy4_11: PropTypes.number.isRequired,
			fy4_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,

			fy5: PropTypes.number.isRequired,
			fy5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_0: PropTypes.number.isRequired,
			fy5_0_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_1: PropTypes.number.isRequired,
			fy5_1_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_2: PropTypes.number.isRequired,
			fy5_2_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_3: PropTypes.number.isRequired,
			fy5_3_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_4: PropTypes.number.isRequired,
			fy5_4_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_5: PropTypes.number.isRequired,
			fy5_5_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_6: PropTypes.number.isRequired,
			fy5_6_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_7: PropTypes.number.isRequired,
			fy5_7_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_8: PropTypes.number.isRequired,
			fy5_8_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_9: PropTypes.number.isRequired,
			fy5_9_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_10: PropTypes.number.isRequired,
			fy5_10_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
			fy5_11: PropTypes.number.isRequired,
			fy5_11_Apps: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
		}).isRequired
	).isRequired,
	currentFYear: PropTypes.number.isRequired,
	additionalNotes: PropTypes.object.isRequired,
	options: PropTypes.shape({
		market: TableUtilities.PropTypes.options,
		rule: TableUtilities.PropTypes.options,
		multiExpand: PropTypes.bool
	}).isRequired,
	pageSize: PropTypes.number.isRequired,
	setup: PropTypes.object
};

export default Table;