import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

//actions
import { storeScientists, storeGold, clearProfile } from '../../actions/profile.js';

import Axios from 'axios';
//panels
import CommonLinks from '../panels/common_links.jsx';
import EquipmentPanel from '../panels/equipment.jsx';

class Equipment extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			fetch: null,
			warning: ''
		};

		this.getProfile(this.props.username);
	}

	componentDidMount() {
		if (!this.props.loggedIn) {
			this.props.history.replace('/login');
		}
	}

	componentWillUnmount() {
		this.props.clearProfile();
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (JSON.stringify(this.state) !== JSON.stringify(prevState)) {
			this.state.fetch();
			this.sendRequest(this.props.username);
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='sidePanelPage'>
				<div className='sidePanel'>
					<CommonLinks />
				</div>

				<div className='mainPanel'>
					<div className='warning' style={warningStyle}>
						<p>{this.state.warning}</p>
					</div>

					<h1 className='centered'>Equipment</h1>
					<p className='centered'>Your Scientists: {this.props.scientists} / Your Gold: {this.props.gold}</p>

					<EquipmentPanel
						getFetch={this.getFetch.bind(this)}
						setWarning={this.setWarning.bind(this)}
						scientists={this.props.scientists}
						gold={this.props.gold}
						onSuccess={() => this.getProfile(this.props.username)}
					/>
				</div>
			</div>
		);
	}

	//gameplay functions
	async getProfile(url, username = "") { //send a unified request, using my credentials
		// use Axios
		let response = await Axios.get(`/api/game/profile/${username}`, {
			withCredentials:true
		})

		//on success
		this.props.storeScientists(response.data.scientists);
		this.props.storeGold(response.data.gold);
	}

	// xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
	// xhr.send(JSON.stringify({
	// 	id: this.props.id,
	// 	token: this.props.token,
	// 	...args
	// }));


//bound callbacks
getFetch(fn) {
	this.setState({ fetch: fn });
}

setWarning(s) {
	this.setState({ warning: s });
}
};

Equipment.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,
	username: PropTypes.string.isRequired,
	loggedIn: PropTypes.bool.isRequired,
	storeScientists: PropTypes.func.isRequired,
	storeGold: PropTypes.func.isRequired,
	clearProfile: PropTypes.func.isRequired
};

const mapStoreToProps = (store) => {
	return {
		id: store.account.id,
		token: store.account.token,
		username: store.account.username,
		loggedIn: store.account.id !== 0,
		scientists: store.profile.scientists,
		gold: store.profile.gold
	};
};

const mapDispatchToProps = (dispatch) => {
	return {
		storeScientists: (x) => dispatch(storeScientists(x)),
		storeGold: (x) => dispatch(storeGold(x)),
		clearProfile: () => dispatch(clearProfile())
	};
};

Equipment = connect(mapStoreToProps, mapDispatchToProps)(Equipment);

export default Equipment;