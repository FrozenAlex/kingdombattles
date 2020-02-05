import { Component, h } from 'preact';
import { Link } from 'preact-router';
import PropTypes from 'prop-types';

import BadgeText from './badge_text.jsx';
import ProgressiveRainbowText from './progressive_rainbow_text.jsx';
import Axios from 'axios';

class PagedLadder extends Component {
	constructor(props) {
		super(props);
		this.state = {
		}
		this.sendRequest('/api/game/profile/ladder', { start: this.props.start || 0, length: this.props.length || 20 });
	}

	render() {
		return (
			<div className='panel table'>
				<div className='row mobile hide'>
					<p className='col centered'>Username</p>
					<p className='col centered'>Soldiers</p>
					<p className='col centered'>Recruits</p>
					<p className='col centered'>Gold</p>
				</div>
				{Object.keys(this.state).map((key) => <div key={key} className={`${this.props.highlightedName === this.state[key].username ? ' highlight' : ''}`}>
					<hr />
					<div className='break' />

					<div className={'row'} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
						<Link className='col centered truncate' href={`/profile/${this.state[key].username}`}>
							<BadgeText name={this.state[key].activeBadge} size={'small'} centered={true}>{this.state[key].username}</BadgeText>
						</Link>

						<p className={'col centered truncate'}><span className='mobile show' style={{ whiteSpace: 'pre' }}>Soldiers: </span>{this.state[key].soldiers}</p>
						<p className={'col centered truncate'}><span className='mobile show' style={{ whiteSpace: 'pre' }}>Recruits: </span>{this.state[key].recruits}</p>
						<p className={'col centered truncate'}><span className='mobile show' style={{ whiteSpace: 'pre' }}>Gold: </span>{this.state[key].gold}</p>
					</div>
				</div>)}
			</div>
		)
	}

	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		try {
			let response = await Axios.post(url, args);
			this.setState(response.data);
			if (this.props.onReceived) {
				this.props.onReceived(response.data);
			}
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			} else {
				console.error(e)
			}
		}
	}
};

PagedLadder.propTypes = {
	start: PropTypes.number,
	length: PropTypes.number,
	highlightedName: PropTypes.string,
	setWarning: PropTypes.func,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
};

export default PagedLadder;