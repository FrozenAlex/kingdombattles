import {Component, h} from 'preact';

import queryString from 'query-string';
import PropTypes from 'prop-types';


//panels
import CommonLinks from '../panels/common_links.jsx';
import PagedSpyingLog from '../panels/paged_spying_log.jsx';
import Axios from 'axios';
import { connect } from 'unistore/preact';
import { route } from 'preact-router';

class SpyingLog extends Component {
	constructor(props) {
		super(props);

		let params = queryString.parse(props.url);

		this.state = {
			params: params,
			start: parseInt(params.log) || 0,
			length: parseInt(params.length) || 20,

			fetch: null,

			warning: ''
		};

		this.sendRequest('/api/game/profile', {username: this.props.username});
	}

	componentDidMount() {
		if (!this.props.account) {
			route('/login/', true)
		}
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (JSON.stringify(this.state) !== JSON.stringify(prevState)) {
			this.state.fetch();
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		let ButtonHeader = this.buttonHeader.bind(this);

		return (
			<div className='sidePanelPage'>
				<div className='sidePanel'>
					
				</div>

				<div className='mainPanel'>
					<div className='warning' style={warningStyle}>
						<p>{this.state.warning}</p>
					</div>

					<h1 className='centered'>Espionage Log</h1>

					<ButtonHeader />
					<PagedSpyingLog
						setWarning={this.setWarning.bind(this)}
						username={this.props.username}
						start={this.state.start}
						length={this.state.length}
						spies={this.props.spies}
						getFetch={this.getFetch.bind(this)}
						onReceived={this.onReceived.bind(this)}
					/>
					<ButtonHeader />
				</div>
			</div>

		);
	}

	buttonHeader() {
		return (
			<div className='table noCollapse'>
				<div className='row'>
					<button className='col' onClick={ this.decrement.bind(this) }>{'< Back'}</button>
					<div className='col hide mobile' />
					<div className='col hide mobile' />
					<button className='col' onClick={ this.increment.bind(this) }>{'Next >'}</button>
				</div>
			</div>
		);
	}

	increment() {
		let start = this.state.start + this.state.length;

		route(`${this.props.path}?log=${start}`, true)
	}

	decrement() {
		let start = Math.max(0, this.state.start - this.state.length);

		//don't decrement too far
		if (start === this.state.start) {
			return;
		}

		route(`${this.props.path}?log=${start}`, true)
	}


	//gameplay functions
	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		try {
			let response = await Axios.post(url, args);
			// this.props.storeSpies(response.spies);
		} catch (e) {
			if (e.response && e.response.data) {
				this.setWarning(e.response.data)
			} 	else{
				console.error(e)
			}
		}
	}

	//bound callbacks
	getFetch(fn) {
		this.setState({ fetch: fn });
	}

	onReceived(data) {
		if (data.length === 0) {
			let start = Math.max(0, this.state.start - this.state.length);

			//don't decrement too far
			if (start === this.state.start) {
				return;
			}

			route(`${this.props.path}?log=${start}`, true)
		}
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

SpyingLog.propTypes = {
	username: PropTypes.string.isRequired,
	loggedIn: PropTypes.bool.isRequired
};

export default connect('account')(SpyingLog);