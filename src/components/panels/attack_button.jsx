import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Axios from 'axios';

class AttackButton extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			units: 0,
			message: ''
		};

		this.sendRequest(this.props.statusRequest, {/* SO MUCH FOR DEFAULT ARGUMENTS IN NODE */}, this.attackStatus.bind(this));
		this.sendRequest('/api/game/profile/', {username: this.props.attacker}, this.profileData.bind(this));
	}

	render() {
		if (this.state.message) {
			return (
				<p className={this.props.className} style={this.props.style}>{this.state.message}</p>
			);
		} else {
			let onClick = (e) => {
				this.sendRequest(this.props.attackRequest, {attacker: this.props.attacker, defender: this.props.defender}, this.attackStatus.bind(this));
				if (this.props.onClick) {
					this.props.onClick(e); //inject something extra
				}
			};

			return (
				<button className={this.props.className} style={this.props.style} onClick={onClick} disabled={this.props.disabled || !this.state.units}>{this.props.children}</button>
			);
		}
	}

	//gameplay functions
	async sendRequest(url, args, onSuccess) { //send a unified request, using my credentials
		try {
			let response = await Axios.post(url, args);
			onSuccess(response.data);
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			} else {
				console.error(e);
			}
		}
	}

	attackStatus(json) {
		if (json.status === this.props.pendingStatus) {
			this.setState({ message: `${this.props.pendingMsg} ${json.defender}` });
		}
	}

	profileData(json) {
		this.setState({units: this.props.parseUnits(json)});
	}
};

AttackButton.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	attacker: PropTypes.string.isRequired,
	defender: PropTypes.string.isRequired,
	statusRequest: PropTypes.string.isRequired,
	attackRequest: PropTypes.string.isRequired,
	pendingStatus: PropTypes.string.isRequired,
	pendingMsg: PropTypes.string.isRequired,
	parseUnits: PropTypes.func.isRequired,

	className: PropTypes.string,
	style: PropTypes.object,
	onClick: PropTypes.func,
	setWarning: PropTypes.func,
	disabled: PropTypes.bool
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

AttackButton = connect(mapStoreToProps, mapDispatchToProps)(AttackButton);

export default AttackButton;