import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

//actions
import { storeScientists, storeGold, clearProfile } from '../../actions/profile.js';

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

		this.sendRequest('/profilerequest', {username: this.props.username});
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
			this.sendRequest('/profilerequest', {username: this.props.username});
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

					<EquipmentPanel
						getFetch={this.getFetch.bind(this)}
						setWarning={this.setWarning.bind(this)}
						scientists={this.props.scientists}
						gold={this.props.gold}
					/>
				</div>
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

					//on success
					this.props.storeScientists(json.scientists);
					this.props.storeGold(json.gold);
				}
				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
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

	//bound callbacks
	getFetch(fn) {
		this.setState({ fetch: fn });
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

Equipment.propTypes = {
	username: PropTypes.string.isRequired,
	loggedIn: PropTypes.bool.isRequired,
	storeScientists: PropTypes.func.isRequired,
	storeGold: PropTypes.func.isRequired,
	clearProfile: PropTypes.func.isRequired
};

const mapStoreToProps = (store) => {
	return {
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