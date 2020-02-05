import {Component, h} from 'preact';

import { connect } from 'unistore/preact';
import Axios from 'axios';
import { actions } from '../../actions';

class Logout extends Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}
	}

	render() {
		return (
			<button className='logoutButton' type='submit' onClick={(e) => { e.preventDefault(); this.logoutRequest('/api/account/logout') }} >Logout</button>
		);
	}

	async logoutRequest(url, args = {}) {
		let response = await Axios.get('/api/account/logout')
	
		// Wait for a response to invalidate sessions
		this.props.logout();
		this.props.clearProfile()

		if (this.props.onClick) {
			this.props.onClick();
		}
	}
};

export default connect('account', actions)(Logout);