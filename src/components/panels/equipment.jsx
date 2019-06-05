import React from 'react';
import { withRouter, Link } from 'react-router-dom';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';

class Equipment extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			data: []
		};

		if (this.props.getFetch) {
			this.props.getFetch((field) => this.sendRequest('/equipmentrequest', {field: field} ));
		}
	}

	render() {
		let display = this.flattenStructure(this.state.data, this.props.scientists);

		//if there are no scientists
		if (this.props.scientists <= 0 && display.length === 0) {
			return (
				<div className='panel'>
					<p className='centered'>You have no scientists!</p>
					<p className='centered'>Go and <Link to='/profile'>train some!</Link></p>
				</div>
			);
		}

		return (
			<div className='panel'>
				<div className='table'>
					<div className='row'>
						<p className='col centered truncate'>Name</p>
						<p className='col centered truncate'>Type</p>
						<p className='col centered truncate'>Boost</p>
						<p className='col centered truncate'>Owned</p>
						<p className='col centered truncate mobile hide alwaysCentered'>Buy</p>
						<p className='col centered truncate mobile hide alwaysCentered'>Sell</p>
					</div>

					<hr className='mobile show' />
					<div className='break mobile show' />

					{Object.keys(display).map((key) => <div key={key}>
						<hr className='mobile hide'/>
						<div className='break mobile hide' />
						<div className='row'>
							<p className='col centered truncate equipmentTextPadding'>{display[key].name}</p>
							<p className='col centered truncate equipmentTextPadding'>{display[key].type}</p>
							<p className='col centered truncate equipmentTextPadding'>{display[key].combatBoost * 100}%</p>
							<p className='col centered truncate equipmentTextPadding'>{display[key].owned}</p>
							<div className='break mobile show' />
							<div className='col row noCollapse' style={{flex: '1 1 17.5%'}}>
								{display[key].purchasable ? <button className='col centered truncate' onClick={() => this.sendRequest('/equipmentpurchaserequest', { name: display[key].name, type: display[key].type }) } disabled={display[key].cost > this.props.gold}>Buy ({display[key].cost} gold)</button> : <div className='col centered truncate' />}
								{display[key].saleable ? <button className='col centered truncate' onClick={() => this.sendRequest('/equipmentsellrequest', { name: display[key].name, type: display[key].type }) } disabled={display[key].owned === 0}>Sell ({Math.floor(display[key].cost/2)} gold)</button> : <div className='col centered truncate' />}
							</div>
						</div>
						<div className='break' />
					</div>)}
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
					this.setState({ data: json });

					if (this.props.onSuccess) {
						this.props.onSuccess(json);
					}
				}
				else if (xhr.status === 400 && this.props.setWarning) {
					this.props.setWarning(xhr.responseText);
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

Equipment.propTypes = {
	id: PropTypes.number.isRequired,
	token: PropTypes.number.isRequired,

	setWarning: PropTypes.func,
	getFetch: PropTypes.func,
	onSuccess: PropTypes.func
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

Equipment = connect(mapStoreToProps, mapDispatchToProps)(Equipment);

export default withRouter(Equipment);