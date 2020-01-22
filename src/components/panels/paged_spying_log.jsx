import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import SpyingLogRecord from './spying_log_record.jsx';

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
	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					json.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));

					//on success
					this.setState({ data: json }); //OVERRIDE existing data

					if (this.props.onReceived) {
						this.props.onReceived(json);
					}
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			id: this.props.id,
			token: this.props.token,
			...args
		}));
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