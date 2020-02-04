import {Component, h} from 'preact';
// import PropTypes from 'prop-types';
import Axios from 'axios';

class Statistics extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {}
		};

		if (props.getFetch) {
			props.getFetch(() => this.sendRequest('/api/game/stats/'));
		}
	}

	render() {
		return (
			<div className='panel table noCollapse'>
				{Object.keys(this.state.data).map((key) => <div key={key} className='row'>
					<p className='col'>{key}:</p>
					<p className='col'>{typeof(this.state.data[key]) === 'object' ? <span style={{color: this.state.data[key].color}}>{this.state.data[key].string}</span> : <span>{this.state.data[key]}</span>}</p>
					<div className='col mobile hide' />
				</div>)}
			</div>
		);
	}

	async sendRequest(url, args = {}) { //send a unified request, using my credentials
		try {
			let response = await Axios.post(url, args);
			this.setState({ data: response.data });
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			} 	else{
				console.error(e)
			}
		}
	}
};

export default Statistics;