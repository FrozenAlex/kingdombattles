import {Component, h} from 'preact';
import { Link, route } from 'preact-router';

//panels
import PasswordChangePanel from '../panels/password_change.jsx';
import { connect } from 'unistore/preact';

class PasswordChange extends Component {
	constructor(props) {
		super(props);
		this.state = {
			changed: ''
		}
	}

	componentDidMount() {
		if (!this.props.account) {
			route('/', true);
		}
	}

	render() {
		let Panel;

		if (!this.state.changed) {
			Panel = () => {
				return (<PasswordChangePanel onSuccess={(msg) => this.setState({ changed: msg }) } />);
			}
		} else {
			Panel = () => {
				return (<p>{this.state.changed}</p>);
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

export default connect('account')(PasswordChange);