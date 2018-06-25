import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import LifecycleUtilities from './common/leanix-reporting-utilities/LifecycleUtilities';
import TableUtilities from './common/react-leanix-reporting/TableUtilities';

class Table extends Component {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				striped condensed hover maxHeight='300px'
			>
				{this._renderTableColumns(this.props.factsheetType)}
			</BootstrapTable>
		);
	}

	_renderTableColumns() {
		const lifecycleModel = this.props.lifecycleModel;
		const lifecycleModelTranslations = LifecycleUtilities.translateModel(this.props.setup, lifecycleModel, this.props.factsheetType);
		/* TODO
			{
				0: '',
				1: '',
				2: '',
				...
				n: ''
			}
		*/
		const tableColumns = [(
				<TableHeaderColumn key='name' dataSort
					dataField='name'
					dataAlign='left'
					dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					formatExtraData={{ type: this.props.factsheetType, id: 'id' }}
					filter={TableUtilities.textFilter}
				>Name</TableHeaderColumn>
			), (
				<TableHeaderColumn key='current' dataSort
					dataField='current'
					dataAlign='left'
					dataFormat={TableUtilities.formatEnum}
					formatExtraData={{}}
					filter={TableUtilities.selectFilter({})}
				>Current phase</TableHeaderColumn>
			)
		];
		return tableColumns.concat(lifecycleModel.map((phase, i) => {
			return (
				<TableHeaderColumn key={phase}
					dataField={phase}
					headerAlign='left'
					dataAlign='right'
					dataFormat={TableUtilities.formatDate}
					filter={TableUtilities.dateFilter}
				>{lifecycleModelTranslations[i]}</TableHeaderColumn>
			);
		}));
	}
}

Table.propTypes = {
	data: PropTypes.arrayOf(
		PropTypes.shape({
			name: PropTypes.string.isRequired,
			current: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	setup: PropTypes.object.isRequired,
	lifecycleModel: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
	factsheetType: PropTypes.string.isRequired
};

export default Table;