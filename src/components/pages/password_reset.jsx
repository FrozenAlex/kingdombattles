import {Component, h} from 'preact';
import { Link } from 'preact-router';
import queryString from 'query-string';

//panels
import PasswordResetPanel from '../panels/password_reset.jsx';

class PasswordReset extends Component {
	constructor(props) {
		super(props);
		this.state = {
			reset: '',
			params: queryString.parse(props.location.search)
		}
	}

	render() {
		let Panel;

		if (!this.state.reset) {
			Panel = () => {
				return (<PasswordResetPanel email={this.state.params.email} token={this.state.params.token} onSuccess={ (msg) => this.setState({reset: msg}) } />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.reset}</p>);
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

export default PasswordReset;