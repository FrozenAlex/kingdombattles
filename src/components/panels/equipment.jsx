import {Component, h} from 'preact';
import { Link } from 'preact-router';

// import PropTypes from 'prop-types';
import Axios from 'axios';
import { connect } from 'unistore/preact';

class Equipment extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: []
		};
	}

	componentDidMount () {
		// TODO: Check what's going on
		this.getEquipment('/api/game/equipment/');
	}

	render() {
		let display = this.flattenStructure(this.state.data, this.props.scientists);
		//if there are no scientists
		if (this.props.scientists <= 0 && display.length === 0) {
			return (
				<div className='panel'>
					<p className='centered'>You have no scientists!</p>
					<p className='centered'>Go and <Link href='/profile/'>train some!</Link></p>
				</div>
			);
		}

		return (
			<div className='panel'>
				<div className='table'>
					<div className='row mobile hide'>
						<p className='col centered truncate'>Name</p>
						<p className='col centered truncate'>Type</p>
						<p className='col centered truncate'>Boost</p>
						<p className='col centered truncate'>Owned</p>
						<p className='col centered truncate'>Buy</p>
						<p className='col centered truncate'>Sell</p>
					</div>

					<hr className='mobile show' />

					{Object.keys(display).map((key) => <div key={key}>
						<hr className='mobile hide'/>
						<div className='break mobile hide' />
						<div className='row'>
							<p className='col centered truncate equipmentTextPadding'>{display[key].name}</p>
							<p className='col centered truncate equipmentTextPadding'>{display[key].type}</p>
							<p className='col centered truncate equipmentTextPadding'><span className='mobile show' style={{whiteSpace: 'pre'}}>+</span>{display[key].combatBoost * 100}%</p>
							<p className='col centered truncate equipmentTextPadding'><span className='mobile show' style={{whiteSpace: 'pre'}}>Owned: </span>{display[key].owned}</p>
							<div className='break mobile show' />
							<div className='col row noCollapse' style={{flex: '1 1 17.5%'}}>
								{display[key].purchasable ? <button className='col centered truncate' onClick={() => this.sendRequest('/api/game/equipment/purchase', { name: display[key].name, type: display[key].type }) } disabled={display[key].cost > this.props.gold}>Buy <span className='mobile show' style={{whiteSpace:'pre'}}>{display[key].name} </span>({display[key].cost} gold)</button> : <div className='col' />}
								{display[key].saleable ? <button className='col centered truncate' onClick={() => this.sendRequest('/api/game/equipment/sell', { name: display[key].name, type: display[key].type }) } disabled={display[key].owned === 0}>Sell <span className='mobile show' style={{whiteSpace:'pre'}}>{display[key].name} </span>({Math.floor(display[key].cost/2)} gold)</button> : <div className='col' />}
							</div>
						</div>
						<div className='break' />
					</div>)}
				</div>
			</div>
		);
	}

	//gameplay functions
	async getEquipment (url, username = "") { //send a unified request, using my credentials
		// use Axios
		let response = await Axios.post(`/api/game/equipment/`)

		//on success
		this.setState({ data: Object.assign({}, this.state.data, response.data) });
	}

	async sendRequest(url, args = {}) { //send a unified request, using cookies 
		try {
			let response = await Axios.post(url, args);
			this.setState({ data: Object.assign({}, this.state.data, response.data) });
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			}	else{
				console.error(e)
			}
		}
	}

	flattenStructure(structure, scientists) {
		if (!structure || !structure.statistics) {
			return [];
		}

		let ret = []; //return value: ret[0] = { name: '', type: '', owned: 0, cost: 0 }

		Object.keys(structure.statistics).map((type) => {
			Object.keys(structure.statistics[type]).map((name) => {
				//don't render high level items you don't own
				if (structure.statistics[type][name].scientistsRequired > scientists && !structure.owned[name]) {
					return;
				}

				//if you can't see it and you don't own it, don't render it (for legendary items)
				if (!structure.statistics[type][name].visible && !structure.owned[name]) { //TODO: sort out the visible mixup
					return;
				}

				//finally
				ret.push({
					name: name,
					type: type,
					owned: (structure.owned && structure.owned[name]) || 0,
					...structure.statistics[type][name],
					purchasable: structure.statistics[type][name].purchasable && structure.statistics[type][name].scientistsRequired <= scientists //negate purchasing of too-high-level items
				});
			});
		});

		return ret;
	}
};


export default connect('account')(Equipment);