import {Component, h} from 'preact';
import { Link, route } from 'preact-router';
import { Provider, connect } from 'unistore/preact'

class CommonLinks extends Component {
	constructor(props) {
		super(props);

		this.state = {
			//
		}
	}

	render() {
		//render any extra stuff
		let Extra;

		if (this.props.extra) {
			Extra = this.props.extra;
		} else {
			Extra = () => null;
		}

		//if logged in
		if (this.props.account) {
			return (
				<div className='panel'>
					<p className='mobile centered'><Link href='/profile/'>Your Kingdom</Link></p>
					<p className='mobile centered'><Link href='/equipment/'>Your Equipment</Link></p>
					<p className='mobile centered'><Link href='/badges/'>Your Badges</Link></p>
					<p className='mobile centered'><Link href='/ladder/'>Attack (Game Ladder)</Link></p>
					<p className='mobile centered'><Link href='/combatlog/' >Combat Log</Link></p>
					<p className='mobile centered'><Link href='/spyinglog/'>Espionage Log</Link></p>
					<p className='mobile centered'><Link href='/passwordchange/'>Change Password</Link></p>
					<p className='mobile centered'><Link href='/tasklist/'>Task List</Link></p>
					<p className='mobile centered'><Link href='/patrons/' >Patron List</Link></p>
					<p className='mobile centered'><Link href='/rules' >Rules</Link></p>
					<p className='mobile centered'><Link href='/statistics'>Game Stats</Link></p>
					<p className='mobile centered'><Link href='/privacysettings'>Privacy Settings</Link></p>

					<Extra />
				</div>
			);
		} else { //if not logged in
			return (
				<div className='panel'>
					<p className='mobile centered'><Link href='/signup/' >Sign Up</Link></p>
					<p className='mobile centered'><Link href='/login/'>Login</Link></p>
					<p className='mobile centered'><Link href='/passwordrecover'>Recover Password</Link></p>
					<p className='mobile centered'><Link href='/ladder'>Game Ladder</Link></p>
					<p className='mobile centered'><Link href='/tasklist'>Task List</Link></p>
					<p className='mobile centered'><Link href='/patrons/'>Patron List</Link></p>
					<p className='mobile centered'><Link href='/rules' >Rules</Link></p>
					<p className='mobile centered'><Link href='/statistics'>Game Stats</Link></p>

					<Extra />
				</div>
			);
		}
	}
};

// CommonLinks.propTypes = {
// 	loggedIn: PropTypes.bool.isRequired,

// 	onClickSignup: PropTypes.func,
// 	onClickLogin: PropTypes.func,
// 	onClickPasswordChange: PropTypes.func,
// 	onClickPasswordRecover: PropTypes.func,
// 	onClickProfile: PropTypes.func,
// 	onClickEquipment: PropTypes.func,
// 	onClickBadges: PropTypes.func,
// 	onClickLadder: PropTypes.func,
// 	onClickCombatLog: PropTypes.func,
// 	onClickSpyingLog: PropTypes.func,
// 	onClickTaskList: PropTypes.func,
// 	onClickPatronList: PropTypes.func,
// 	onClickRules: PropTypes.func,
// 	onClickStatistics: PropTypes.func,
// 	onClickPrivacySettings: PropTypes.func
// };

CommonLinks = connect('account')(CommonLinks);

export default CommonLinks;