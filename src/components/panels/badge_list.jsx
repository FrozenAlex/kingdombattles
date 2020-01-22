import React from 'react';
import PropTypes from 'prop-types';

import Badge from './badge.jsx';
import PossibleBadges from './../../assets/badges.js'

class BadgeList extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {
				badges: PossibleBadges
			}
		};
	}

	render() {
		if (!this.state.data.badges) {
			return (
				<p className='panel'>Loading badges...</p>
			);
		}

		return (
			<div className='panel table'>
				{Object.keys(this.state.data.badges).map((name) =>
					<div key={name}>
						<div className={'panel row'} style={{padding: 10}}>
							<div className={'col centered'} style={{ minWidth: 110 }}>
								<Badge name={name} filename={this.state.data.badges[name].filename} />
							</div>
							<div className={'col'} style={{flex: 4, display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
								<h2>{name}</h2>
								<p>{this.state.data.badges[name].description}</p>
								<p>Unlockable: {this.state.data.badges[name].unlockable ? <span style={{color: 'lightgreen'}}>Yes</span> : this.state.data.badges[name].unlockable === null ? <span style={{color: 'yellow'}}>Coding Incomplete</span> : <span style={{color: 'red'}}>No</span>}</p>
							</div>
						</div>
						<div className='row'>
							<hr className='col mobile show' />
						</div>
					</div>
				)}
			</div>
		);
	}
};

BadgeList.propTypes = {
	setWarning: PropTypes.func,
	getFetch: PropTypes.func
};

export default BadgeList;