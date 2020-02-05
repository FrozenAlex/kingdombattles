import {Component, h} from 'preact';
import queryString from 'query-string';
import PropTypes from 'prop-types';

//panels
import CommonLinks from '../panels/common_links.jsx';
import PagedCombatLog from '../panels/paged_combat_log.jsx';
import { route } from 'preact-router';
import { connect } from 'unistore/preact';

class CombatLog extends Component {
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
	}

	componentDidMount() {
		if (!this.props.account) {
			route('/login/', true)
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		let ButtonHeader = this.buttonHeader.bind(this);

		return (
			<div className='sidePanelPage'>

				<div className='mainPanel'>
					<div className='warning' style={warningStyle}>
						<p>{this.state.warning}</p>
					</div>

					<h1 className='centered'>Combat Log</h1>

					<ButtonHeader />
					<PagedCombatLog
						setWarning={this.setWarning.bind(this)}
						start={this.state.start}
						length={this.state.length}
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

		route(`${this.props.path}?log=${start}`, true);
	}

	decrement() {
		let start = Math.max(0, this.state.start - this.state.length);

		//don't decrement too far
		if (start === this.state.start) {
			return;
		}
		route(`${this.props.path}?log=${start}`, true);
	}

	onReceived(data) {
		if (data.length === 0) {
			let start = Math.max(0, this.state.start - this.state.length);

			//don't decrement too far
			if (start === this.state.start) {
				return;
			}

			route(`${this.props.location.pathname}?log=${start}`, true);
		}
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};


export default connect('account')(CombatLog);