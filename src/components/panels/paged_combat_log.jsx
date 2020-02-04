import {Component, h} from 'preact';
import { Link } from 'preact-router';

import CombatLogRecord from './combat_log_record.jsx';
import Axios from 'axios';
import { connect } from 'unistore/preact';

class PagedCombatLog extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: []
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/api/game/combatlog', { start: props.start, length: props.length }));
		}
	}

	render() {
		//nothing to report
		if (this.state.data.length === 0) {
			return (
				<div className='panel'>
					<p className='centered'>Go and <Link href='/ladder/'>attack someone!</Link></p>
				</div>
			);
		}

		return (
			<div className='panel'>
				{Object.keys(this.state.data).map((key) => <CombatLogRecord key={key} username={this.props.username} {...this.state.data[key]} />)}
			</div>
		);
	}

	//gameplay functions
	async sendRequest(url, args = {}) { 
		try {
			let response = await Axios.post(url, args);
			let data = response.data;
			data.sort((a, b) => new Date(b.eventTime) - new Date(a.eventTime));
			this.setState({ data: data });
			if (this.props.onReceived) {
				this.props.onReceived(data);
			}
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			}	else{
				console.error(e)
			}
		}

	}
};


// const mapStoreToProps = (store) => {
// 	return {
// 		id: store.account.id,
// 		token: store.account.token
// 	};
// };

// const mapDispatchToProps = (dispatch) => {
// 	return {
// 		//
// 	};
// };


export default connect('account')(PagedCombatLog);