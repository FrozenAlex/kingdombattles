import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import SpyingLogRecord from './spying_log_record.jsx';
import Axios from 'axios';

class PagedSpyingLog extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: []
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/api/game/spy/log', {start: props.start, length: props.length}));
		}
	}

	render() {
		//if there are no spies
		if (this.state.data.length === 0) {
			return (
				<div className='panel'>
					<p className='centered'>It's empty in here, isn't it?</p>
				</div>
			);
		}

		return (
			<div className='panel'>
				{Object.keys(this.state.data).map((key) => <SpyingLogRecord key={key} username={this.props.username} {...this.state.data[key]} />)}
			</div>
		);
	}

	//gameplay functions
	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		try {
			let response = await Axios.post(url, args);
			let data = response.data;

			data.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
			this.setState({data:data});
			if (this.props.onReceived) {
				this.props.onReceived(data);
			}
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			} 	else{
				console.error(e)
			}
		}
	}
};

PagedSpyingLog.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	username: PropTypes.string.isRequired,
	start: PropTypes.number.isRequired,
	length: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
};

const mapStoreToProps = (store) => {
	return {
		id: store.account.id,
		token: store.account.token
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		//
	};
};

PagedSpyingLog = connect(mapStoreToProps, mapDispatchToProps)(PagedSpyingLog);

export default PagedSpyingLog;