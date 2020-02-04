import {Component, h} from 'preact';
import { Link } from 'preact-router';

//panels
import SignupPanel from '../panels/signup.jsx';

class Signup extends Component {
	constructor(props) {
		super(props);
		this.state = {
			signedUp: ''
		}
		console.log("Signuppanel", this)
	}

	render() {
		let Panel;

		if (!this.state.signedUp) {
			Panel = () => {
				return (<SignupPanel onSuccess={ (msg) => this.setState({signedUp: msg}) } />);
			}
		} else {
			Panel = () => {
				return (<p className='centered'>{this.state.signedUp}</p>);
			}
		}

		return (
			<div className='page constrained'>
				<Panel />
				<Link href='/' className='centered'>Return Home</Link>
				<div className='break' />
				<p className='centered'><em>(Remember to verify your email!)</em></p>
			</div>
		);
	}
};

export default Signup;