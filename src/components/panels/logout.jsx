import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import { logout } from '../../actions/account.js';
import Axios from 'axios';

class Logout extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}
	}

	render() {
		return (
			<button className='logoutButton' type='submit' onClick={(e) => { e.preventDefault(); this.sendRequest('/api/account/logout') }} >Logout</button>
		);
	}

	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let response = await Axios.get('/api/account/logout')
	
		// Wait for a response to invalidate sessions
		this.props.logout();

		if (this.props.onClick) {
			this.props.onClick();
		}
	}
};

Logout.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,
	logout: PropTypes.func.isRequired,

	onClick: PropTypes.func
};

function mapStoreToProps(store) {
	return {
		id: store.account.id,
		token: store.account.token
	}
};

function mapDispatchToProps(dispatch) {
	return {
		logout: () => { dispatch(logout()) }
	}
};

Logout = connect(mapStoreToProps, mapDispatchToProps)(Logout);

export default Logout;