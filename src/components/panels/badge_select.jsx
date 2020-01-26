import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

import Badge from './badge.jsx';
import BadgeList from '../../assets/badges.js'
import Axios from 'axios';

class BadgeSelect extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			badges: BadgeList,
			owned: null
		};

	}

	componentDidMount() {
		this.getOwnedBadges()
	}

	render() {
		if (!this.state.owned) {
			return (
				<p className='panel'>Loading badges...?</p>
			);
		}

		//are none selected?
		let anySelected = Object.keys(this.state.owned).reduce((accumulator, name) => accumulator || this.state.owned[name].active, false);

		return (
			<div className='panel table'>
				<div key={name}>
					<div className={`panel row${!anySelected ? ' highlight' : ''}`} style={{ padding: 10, minHeight: 120 }} onClick={() => this.setActiveBadge(null)}>
						<p className={'col centered'} style={{ alignSelf: 'center' }}>No Badge</p>
					</div>
					<div className='row'>
						<hr className='col mobile show' />
					</div>
				</div>

				{Object.keys(this.state.owned).map((name) =>
					<div key={name}>
						<div className={`panel row${this.state.owned[name].active ? ' highlight' : ''}`} style={{ padding: 10 }} onClick={() => this.setActiveBadge(name)}>
							<div className={'col centered'} style={{ minWidth: 110 }}>
								<Badge name={name} filename={this.state.badges[name].filename} />
							</div>
							<p className={'col'} style={{ flex: 4, alignSelf: 'center' }}>{this.state.badges[name].description}</p>
						</div>
						<div className='row'>
							<hr className='col mobile show' />
						</div>
					</div>
				).reverse()}
			</div>
		);
	}

	//gameplay functions
	async setActiveBadge(name) {
		let response = await Axios.post(
			'/api/game/badges/active',
			{name: name}
		)
		this.setState({
			...this.state,
			owned: response.data
		});
	}
	async getOwnedBadges() { //send a unified request, using my credentials
		let response = await Axios.post('/api/game/badges/owned')
		//on success
		this.setState({
			...this.state,
			owned: response.data
		});
	}


};

BadgeSelect.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	getFetch: PropTypes.func
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

BadgeSelect = connect(mapStoreToProps, mapDispatchToProps)(BadgeSelect);

export default BadgeSelect;