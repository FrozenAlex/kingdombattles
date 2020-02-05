import { Component, h } from 'preact';
import { Link } from 'preact-router';
import queryString from 'query-string';

//panels
import CommonLinks from '../panels/common_links.jsx';
import AttackButton from '../panels/attack_button.jsx';
import BadgeText from '../panels/badge_text.jsx';
import RawHTML from '../utilities/RawHTML.jsx';
import Axios from 'axios';
import { connect } from 'unistore/preact';
import { actions } from '../../actions/index.js';

class Profile extends Component {
	constructor(props) {
		super(props);
		this.state = {
			loggedIn: !!this.props.account, // Convert to boolean
			params: this.props.matches,
			warning: '',
			profile: null
		};
		console.log(this)
	}

	componentDidMount() {
		if (this.props.matches.username) { // requests other user
			this.getProfile(this.props.matches.username);
		} else {
			if (this.props.account && !this.props.profile) { // If account exists and no profile then get profile
				this.sendRequest('/api/game/profile'); 
			}
		}


	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};
		// profile dynamic link
		let profile = (this.props.matches.username) ? this.state.profile : this.props.profile;

		let mykingdom = (!this.props.matches.username)

		//finally
		return (
			<div className='page'>
				<div className='sidePanelPage'>

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>
						<div class="infoPanel">
							<h1 className='centered'>{(mykingdom) ? 'Your Kingdom' : `${this.props.profile.username}'s Kingdom`}</h1>

							<div className="actions">
								{(profile) ? this.profileView(profile) : 'Loading...'}
							</div>
							{(profile) ? this.profileActions(profile) : 'Loading...'}
						</div>
						<RawHTML html={require('../../assets/content/instructions.md')}></RawHTML>
					</div>
				</div>
			</div>
		);
	}

	profileView(profile) {

		return (
			<div className="profileInfo">
				<div className="box">
					<BadgeText style={{ 'font-size': "2em" }} className={'col'} name={profile.activeBadge} size={'small'}>{profile.username}</BadgeText>
				</div>

				<div className="box">
					<p>Gold</p>
					<p>{profile.gold}</p>
				</div>

				<div className="box">
					<p>Recruits</p>
					<p>{profile.recruits}</p>
				</div>

				<div className="box">
					<p>Soldiers</p>
					<p>{profile.soldiers}</p>
				</div>

				<div className="box">
					<p>Scientists</p>
					<p>{profile.scientists}</p>
				</div>

				<div className="box">
					<p>Spies</p>
					<p>{profile.spies}</p>
				</div>
			</div>
		)
	}

	profileActions(profile) {
		// Private actions
		let creatureTypes = [
			{
				role: 'soldier',
				price: '100'
			},
			{
				role: 'spy',
				price: '200'
			},
			{
				role: 'scientist',
				price: '300'
			}]
		return (
			<div class="actions">
				<h3 class="centered">Actions</h3>
				<button className='w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded' onClick={() => this.sendRequest('/api/game/profile/recruit')}>Recruit More Units</button>

				{creatureTypes.map((creature) => (
					<div class="flex m-1">
						<button className="disabled:opacity-75 flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mx-2" title={(profile.gold < creature.price)?"Not enough gold":""} disabled={(profile.gold < creature.price)} onClick={() => this.sendRequest('/api/game/profile/train', { role: creature.role })}>+ {creature.role} ({creature.price}g)</button>
						<button disabled={profile[creature.name] < 1} className=" disabled:opacity-75 flex-1 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mx-2" onClick={() => this.confirmUntrain(creature.role) && this.sendRequest('/api/game/profile/untrain', { role: creature.role })}>Untrain {creature.role}</button>
					</div>
				))}
			</div >
		)

		return (<div>

		</div>)
	}

	guestPanel() {
		return (<div>

		</div>)
	}

	//gameplay functions
	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		try {
			let result = await Axios.post(url, args);
			let json = result.data;

			this.props.storeProfile(
				json.username,
				json.gold,
				json.recruits,
				json.soldiers,
				json.spies,
				json.scientists,
				json.activeBadge
			);
		} catch (e) {
			this.setWarning(e.response.data)
		}
	}


	async getProfile(username) {
		try {
			let result = await Axios.post('/api/game/profile', {
				username: username
			});
			let json = result.data;

			this.setState({ profile: json })

			return json
		} catch (e) {
			this.setWarning(e.response.data)
		}
	}

	// //panel functions
	// MyProfileSidePanel() {
	// 	return (
	// 		<div className='sidePanel'>
	// 			
	// 		</div>
	// 	);
	// }



	// MyProfileMainPanel() {
	// 	return (
	// 		<div className='panel'>
	// 			<h1 className='centered'>Your Kingdom</h1>
	// 			<div className='table noCollapse'>
	// 				<div className='row'>
	// 					<p className='col truncate'>Username:</p>
	// 					<BadgeText className={'col'} name={this.props.profile.activeBadge} size={'small'}>{this.props.profile.username}</BadgeText>

	// 					<div className='col double'></div>
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Gold:</p>
	// 					<p className='col mobile half truncate'>{this.props.profile.gold}</p>

	// 					<p className='col double truncate'>(+1 gold for each recruit)</p>
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Recruits:</p>
	// 					<p className='col mobile half truncate'>{this.props.profile.recruits}</p>

	// 					<button className='col double truncate' onClick={() => this.sendRequest('/api/game/profile/recruit')}>Recruit More Units</button>
	// 				</div>

	// 				<div className='row'>




	// 				</div>

	// 				<div className='row'>


	// 					

	// 				<div className='row'>



	// 				
	// 				</div>
	// 			</div>

	// 			<div className='break' />
	// 		</div>
	// 	);
	// }

	// NotMyProfileMainPanel() {
	// 	return (
	// 		<div className='panel'>
	// 			<h1 className='centered'>{this.props.profile.username}'s Kingdom</h1>
	// 			<div className='table noCollapse'>
	// 				<div className='row'>
	// 					<p className='col truncate'>Username:</p>
	// 					<BadgeText className={'col'} name={this.props.profile.activeBadge} size={'small'}>{this.props.profile.username}</BadgeText>

	// 					<div className='col double truncate' />
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Gold:</p>
	// 					<p className='col truncate'>{this.props.profile.gold}</p>

	// 					<div className='col double' />
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Recruits:</p>
	// 					<p className='col truncate'>{this.props.profile.recruits}</p>

	// 					<AttackButton
	// 						className={'col double truncate'}
	// 						setWarning={this.setWarning.bind(this)}
	// 						attacker={this.props.account.username}
	// 						defender={this.props.profile.username}
	// 						statusRequest={'/api/game/attackstatus'}
	// 						attackRequest={'/api/game/attack'}
	// 						pendingStatus={'attacking'}
	// 						pendingMsg={'Your soldiers are attacking'}
	// 						parseUnits={(json) => json.soldiers}
	// 					>Attack</AttackButton>
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Soldiers:</p>
	// 					<p className='col truncate'>{this.props.profile.soldiers}</p>

	// 					<AttackButton
	// 						className={'col double truncate'}
	// 						setWarning={this.setWarning.bind(this)}
	// 						attacker={this.props.account.username}
	// 						defender={this.props.profile.username}
	// 						statusRequest={'/api/game/spy/status'}
	// 						attackRequest={'/api/game/spy/'}
	// 						pendingStatus={'spying'}
	// 						pendingMsg={'Your spies are spying on'}
	// 						parseUnits={(json) => json.spies}
	// 					>Send Spies</AttackButton>
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Scientists:</p>
	// 					<p className='col truncate'>{this.props.profile.scientists}</p>

	// 					<div className='col double' />
	// 				</div>

	// 				<div className='row'>
	// 					<p className='col truncate'>Spies:</p>
	// 					<p className='col truncate'>{this.props.profile.spies}</p>

	// 					<div className='col double' />
	// 				</div>
	// 			</div>
	// 		</div>
	// 	);
	// }

	// LoggedOutMainPanel() {
	// 	return (
	// 		<div className='panel'>
	// 			<h1 className='centered'>{this.props.profile.username}'s Kingdom</h1>

	// 		</div>
	// 	);
	// }

	// statsView(profile) {
	// 	return (
	// 		<div className='table noCollapse'>
	// 			<div className='row'>
	// 				<p className='col truncate'>Username:</p>
	// 				<BadgeText className={'col'} name={profile.activeBadge} size={'small'}>{profile.username}</BadgeText>
	// 				<div className='col double' />
	// 			</div>

	// 			<div className='row'>
	// 				<p className='col truncate'>Gold:</p>
	// 				<p className='col truncate'>{profile.gold}</p>
	// 				<div className='col double' />
	// 			</div>

	// 			<div className='row'>
	// 				<p className='col truncate'>Recruits:</p>
	// 				<p className='col truncate'>{profile.recruits}</p>
	// 				<div className='col double' />
	// 			</div>

	// 			<div className='row'>
	// 				<p className='col truncate'>Soldiers:</p>
	// 				<p className='col truncate'>{profile.soldiers}</p>
	// 				<div className='col double' />
	// 			</div>

	// 			<div className='row'>
	// 				<p className='col truncate'>Scientists:</p>
	// 				<p className='col truncate'>{profile.scientists}</p>
	// 				<div className='col double' />
	// 			</div>

	// 			<div className='row'>
	// 				<p className='col truncate'>Spies:</p>
	// 				<p className='col truncate'>{profile.spies}</p>
	// 				<div className='col double' />
	// 			</div>
	// 		</div>
	// 	)
	// }


	// ProfileNotFoundMainPanel() {
	// 	return (
	// 		<div className='page'>
	// 			<p className='centered'>Profile Not Found!</p>
	// 		</div>
	// 	);
	// }

	//popup messages
	confirmNoSoldiers(role) {
		if (this.props.profile.soldiers > 0) {
			return true;
		}

		return window.confirm(`Are you sure you want to train a ${role}? (without a soldier, it'll be very difficult to accrue gold!)`);
	}

	confirmUntrain(role) {
		return window.confirm(`Are you sure you want to untrain a ${role}? (you won't get your gold back!)`);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};


export default connect(['account', 'profile'], actions)(Profile);