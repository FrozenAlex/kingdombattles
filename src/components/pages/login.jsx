import {Component, h} from 'preact';
import { Link, route } from 'preact-router';


//panels
import LoginPanel from '../panels/login.jsx';

class Login extends Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		}
	}

	render() {
		return (
			<div className='page constrained'>
				<LoginPanel onSuccess={(msg) => route('/profile', true)} />
				<Link href='/' className='centered'>Return Home</Link>
			</div>
		);
	}
};

export default Login;