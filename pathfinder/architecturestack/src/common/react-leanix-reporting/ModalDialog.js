/*

Copyright (c) 2018 incowia GmbH

This code can be exclusively used for this report only.
Please contact info[at]incowia.com with the subject "LeanIX Custom Reports: Common artifacts",
if you want to use this code artifact elsewhere.

*/

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TypeUtilities from './../leanix-reporting-utilities/TypeUtilities';

class ModalDialog extends Component {

	constructor(props) {
		super(props);
		this._handleClickForClose = this._handleClickForClose.bind(this);
	}

	_stopEvent(evt) {
		evt.stopPropagation();
	}

	_handleClickForClose(evt) {
		evt.stopPropagation();
		this.props.onClose();
	}

	render() {
		if (!this.props.show) {
			return null;
		}
		const title = TypeUtilities.isFunction(this.props.title) ? this.props.title() : this.props.title;
		// first div prevents click triggers in the outside area
		// second is for positioning of the content panel
		return (
			<div style={{
				position: 'fixed',
				top: '0',
				left: '0',
				width: '100%',
				height: '100%',
				zIndex: '500'
			}} onClick={this._handleClickForClose}>
				<div style={{
					position: 'fixed',
					top: '2.5em',
					width: '100%',
					zIndex: '1000'
				}} onClick={this._handleClickForClose}>
					<div className='panel panel-default' style={{
						width: this.props.width,
						margin: '0 auto',
						zIndex: '2000'
					}} onClick={this._stopEvent}>
						<div className='panel-heading'>
							<h4 className='panel-title'>
								<button type='button' className='close' style={{ right: '0px' }}
									data-dismiss='alert' aria-label='Close'
									onClick={this.props.onClose}>
									<span aria-hidden='true'>&times;</span>
								</button>
								{title}
							</h4>
						</div>
						<div className='panel-body'>
							{this.props.content()}
						</div>
						{this._renderFooter()}
					</div>
				</div>
			</div>
		);
	}

	_renderFooter() {
		if (!this.props.onOK) {
			return null;
		}
		return (
			<div className='panel-footer clearfix'>
				<span className='pull-right'>
					<button type='button' className='btn btn-success btn-sm'
						aria-label='Apply'
						onClick={this.props.onOK}>
						Apply
					</button>
				</span>
				<span className='pull-right' style={{ marginRight: '0.4em' }}>
					<button type='button' className='btn btn-default btn-sm'
						aria-label='Cancel'
						onClick={this.props.onClose}>
						Cancel
					</button>
				</span>
			</div>
		);
	}
}

ModalDialog.propTypes = {
	show: PropTypes.bool.isRequired,
	width: PropTypes.string.isRequired,
	title: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
	content: PropTypes.func.isRequired,
	onClose: PropTypes.func.isRequired,
	onOK: PropTypes.func
};

export default ModalDialog;
