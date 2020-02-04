import {Component, h} from 'preact';
import { Link } from 'preact-router';

//panels
import PasswordRecoverPanel from '../panels/password_recover.jsx';

class PasswordRecover extends Component {
	constructor(props) {
		super(props);
		this.state = {
			recovered: ''
		}
	}

	render() {
		let Panel;

		if (!this.state.recovered) {
			Panel = () => {
				return (<PasswordRecoverPanel onSuccess={(msg) => this.setState( {recovered: msg} )} />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.recovered}</p>);
			}
		}

		return (
			<div className='page constrained'>
				<Panel />
				<Link href='/' className='centered'>Return Home</Link>
			</div>
		);
	}
};

export default PasswordRecover;