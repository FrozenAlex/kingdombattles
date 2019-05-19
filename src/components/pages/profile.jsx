import React from 'react';
import { connect } from 'react-redux';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import queryString from 'query-string';

//panels
import Logout from '../panels/logout.jsx';
import PasswordChange from '../panels/password_change.jsx';

class Profile extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			params: queryString.parse(props.location.search),
			username: '',
			gold: 0,
			recruits: 0,
			soldiers: 0,
			spies: 0,
			scientists: 0,
			warning: ''
		};
	}

	componentWillMount() {
		this.requestProfileData(this.state.params.username ? this.state.params.username : this.props.username);
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		//side panel stuff
		let SidePanel;

		if (this.props.id) {
			if (this.props.username === this.state.username) {
				SidePanel = this.MyProfileSidePanel.bind(this);
			} else {
				SidePanel = this.NotMyProfileSidePanel.bind(this);
			}
		} else { //logged out
			SidePanel = this.LoggedOutSidePanel.bind(this);
		}

		//main panel
		let MainPanel;

		if (this.state.username === this.props.username && this.state.username !== '') {
			MainPanel = this.MyProfileMainPanel.bind(this);
		} else {
			if (this.state.username !== '') {
				MainPanel = this.NotMyProfileMainPanel.bind(this);
			} else {
				MainPanel = this.ProfileNotFoundMainPanel.bind(this);
			}
		}

		//finally
		return (
			<div className='page'>
				<h1 style={{textAlign: 'center', fontSize: '50px', margin: '30px'}}>KINGDOM BATTLES!</h1>

				<div className='sidePanelPage'>
					<SidePanel />
					<div className='newsPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<MainPanel />
					</div>
				</div>
			</div>
		);
	}

	//gameplay functions
	requestProfileData(username) {
		if (username === undefined || username === '') {
			return;
		}

		//request this profile's info, using my credentials
		let formData = new FormData();

		formData.append('id', this.props.id);
		formData.append('token', this.props.token);

		formData.append('username', username);

		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);
					this.storeProfile(
						json.username,
						json.gold,
						json.recruits,
						json.soldiers,
						json.spies,
						json.scientists
					);
				}
				else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		}

		//send
		xhr.open('POST', '/profilerequest', true);
		xhr.send(formData);
	}

	storeProfile(username, gold, recruits, soldiers, spies, scientists) {
		this.setState({
			username: username,
			gold: gold,
			recruits: recruits,
			soldiers: soldiers,
			spies: spies,
			scientists: scientists
		});
	}

	//panel functions
	MyProfileSidePanel() {
		//build the password change panel
		let PasswordChangePanel;

		if (!this.state.changedPassword) {
			PasswordChangePanel = () => {
				return (<PasswordChange onPasswordChange={() => { this.setState({changedPassword: true}) }} />);
			}
		} else {
			PasswordChangePanel = () => {
				return (<p>Password changed!</p>);
			}
		}

		//finally return the side panel
		return (
			<div className='sidePanel'>
				<p>Return <Link to='/'>home</Link></p>
				<PasswordChangePanel />
				<Logout onClick={(e) => this.props.history.push('/')} />
			</div>
		);
	}

	MyProfileMainPanel() {
		return (
			<div className='table'>
				<div className='row'>
					<p className='col'>Username:</p>
					<p className='col'>{this.state.username}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Gold:</p>
					<p className='col'>{this.state.gold}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Recruits:</p>
					<p className='col'>{this.state.recruits}</p>
					<button className='col' style={{flex: '2 1 1.5%'}}>Get More...</button>
				</div>

				<div className='row'>
					<p className='col'>Soldiers:</p>
					<p className='col'>{this.state.soldiers}</p>
					<button className='col'>Train</button>
					<button className='col'>Untrain</button>
				</div>

				<div className='row'>
					<p className='col'>Spies:</p>
					<p className='col'>{this.state.spies}</p>
					<button className='col'>Train</button>
					<button className='col'>Untrain</button>
				</div>

				<div className='row'>
					<p className='col'>Scientists:</p>
					<p className='col'>{this.state.scientists}</p>
					<button className='col'>Train</button>
					<button className='col'>Untrain</button>
				</div>
			</div>
		);
	}

	NotMyProfileSidePanel() {
		//finally return the side panel
		return (
			<div className='sidePanel'>
				<p>Return <Link to='/'>home</Link></p>
				<p>Go to <Link to='/profile' onClick={(e) => { e.preventDefault(); this.requestProfileData(this.props.username); this.setWarning(''); this.props.history.push('/profile'); }}>your profile</Link></p>
				<Logout onClick={(e) => this.props.history.push('/')} />
			</div>
		);
	}

	NotMyProfileMainPanel() {
		return (
			<div className='table'>
				<div className='row'>
					<p className='col'>Username:</p>
					<p className='col'>{this.state.username}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Gold:</p>
					<p className='col'>{this.state.gold}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Recruits:</p>
					<p className='col'>{this.state.recruits}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Soldiers:</p>
					<p className='col'>{this.state.soldiers}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Spies:</p>
					<p className='col'>{this.state.spies}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>

				<div className='row'>
					<p className='col'>Scientists:</p>
					<p className='col'>{this.state.scientists}</p>
					<div className='col'></div>
					<div className='col'></div>
				</div>
			</div>
		);
	}

	LoggedOutSidePanel() {
		return (
			<div className='sidePanel'>
				<p>Return <Link to='/'>home</Link></p>
			</div>
		);
	}

	ProfileNotFoundMainPanel() {
		return (
			<div>
				<p>No profile found!</p>
			</div>
		);
	}

	setWarning(s) {
		this.setState({
			warning: s
		});
	}
}

Profile.propTypes = {
	id: PropTypes.number.isRequired,
	email: PropTypes.string.isRequired,
	username: PropTypes.string.isRequired,
	token: PropTypes.number.isRequired
};

function mapStoreToProps(store) {
	return {
		id: store.account.id,
		email: store.account.email,
		username: store.account.username,
		token: store.account.token
	}
}

function mapDispatchToProps(dispatch) {
	return {
		//
	}
}

Profile = connect(mapStoreToProps, mapDispatchToProps)(Profile);

export default withRouter(Profile);