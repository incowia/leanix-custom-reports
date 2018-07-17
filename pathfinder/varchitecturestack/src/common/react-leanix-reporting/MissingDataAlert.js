import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ModalDialog from './ModalDialog';
import { BootstrapTable, TableHeaderColumn } from 'react-bootstrap-table';
import TableUtilities from './TableUtilities';

class MissingDataAlert extends Component {

	constructor(props) {
		super(props);
		this._renderPopup = this._renderPopup.bind(this);
		this._renderPopupContent = this._renderPopupContent.bind(this);
		this.state = {
			showList: false
		};
	}

	_handleShowList(setTo) {
		return (evt) => {
			if (evt) {
				evt.preventDefault();
			}
			return this.setState({
				showList: setTo
			});
		}
	}

	render() {
		if (!this.props.show || this.props.data.length < 1) {
			return null;
		}
		const factsheet = this.props.factsheetType ? lx.translateFactSheetType(this.props.factsheetType, this.props.data.length > 1 ? 'plural' : 'singular') : (this.props.data.length > 1 ? 'Factsheets' : 'Factsheet');
		return (
			<div>
				{this._renderPopup(factsheet)}
				<div className='alert alert-warning alert-dismissible small' role='alert' style={{ padding: '0.75em' }}>
					<button type='button' className='close' style={{ right: '0px' }}
							data-dismiss='alert' aria-label='Close'
							onClick={this.props.onClose}>
						<span aria-hidden='true'>&times;</span>
					</button>
					<strong>Attention:</strong> {this.props.data.length} {factsheet} not
					included in this report due to missing
					data. <a href='#' className='alert-link' onClick={this._handleShowList(true)}>Show list</a>.
				</div>
			</div>
		);
	}

	_renderPopup(type) {
		if (!this.state.showList) {
			return null;
		}
		return (
			<ModalDialog show={this.state.showList}
				width='700px'
				title={'List of excluded ' + type}
				content={this._renderPopupContent}
				onClose={this._handleShowList(false)}
			/>
		);
	}

	_renderPopupContent() {
		const factsheet = this.props.factsheetType ? lx.translateFactSheetType(this.props.factsheetType, 'singular') : 'Factsheet';
		return (
			<BootstrapTable data={this.props.data} keyField='id'
				striped condensed hover search exportCSV pagination
				options={{ clearSearch: true, hideSizePerPage: true, paginationShowsTotal: true }}
			>
				<TableHeaderColumn dataSort
					 dataField='name'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatLinkFactsheet(this.props.setup)}
					 formatExtraData={{ typeProp: 'type', id: 'id' }}
					 csvHeader={factsheet + '-name'}
					 filter={TableUtilities.textFilter}
					>{factsheet} name</TableHeaderColumn>
				<TableHeaderColumn columnClassName='small'
					 dataField='reason'
					 dataAlign='left'
					 dataFormat={TableUtilities.formatOptionalText}
					 csvHeader='reason'
					 filter={TableUtilities.textFilter}
					>Reason</TableHeaderColumn>
			</BootstrapTable>
		);
	}
}

MissingDataAlert.propTypes = {
	show: PropTypes.bool.isRequired,
	data: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.string.isRequired,
			name: PropTypes.string.isRequired,
			type: PropTypes.string.isRequired,
			reason: PropTypes.string.isRequired
		}).isRequired
	).isRequired,
	onClose: PropTypes.func.isRequired,
	factsheetType: PropTypes.string,
	setup: PropTypes.object.isRequired
};

export default MissingDataAlert;
