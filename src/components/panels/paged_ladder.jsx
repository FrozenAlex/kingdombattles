import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import PropTypes from 'prop-types';

class PagedLadder extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			//TODO: data?
		}

		if (props.getFetch) {
			props.getFetch( () => this.sendRequest('/ladderrequest', {start: this.props.start || 0, length: this.props.length || 20}) );
		}
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
				{Object.keys(this.state).map((key) =><div key={key}>
					<hr />
					<div className='break' />
					<div className={'row'}>
						<p className={'col centered truncate'}><Link to={`/profile?username=${this.state[key].username}`}>{this.state[key].username}</Link></p>
						<p className={'col centered truncate'}><span className='mobile show' style={{whiteSpace: 'pre'}}>Soldiers: </span>{this.state[key].soldiers}</p>
						<p className={'col centered truncate'}><span className='mobile show' style={{whiteSpace: 'pre'}}>Recruits: </span>{this.state[key].recruits}</p>
						<p className={'col centered truncate'}><span className='mobile show' style={{whiteSpace: 'pre'}}>Gold: </span>{this.state[key].gold}</p>
					</div>
				</div>)}
			</div>
		);
	}

	sendRequest(url, args = {}) { //send a unified request, using my credentials
		//build the XHR
		let xhr = new XMLHttpRequest();
		xhr.open('POST', url, true);

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					//on success
					this.setState(json);

					if (this.props.onReceived) {
						this.props.onReceived(json);
					}
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
				}
			}
		};

		xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhr.send(JSON.stringify({
			//NOTE: No id or token needed for the news
			...args
		}));
	}
};

PagedLadder.propTypes = {
	start: PropTypes.number,
	length: PropTypes.number,
	setWarning: PropTypes.func,
	getFetch: PropTypes.func,
	onReceived: PropTypes.func
};

export default withRouter(PagedLadder);