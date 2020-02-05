import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import PrivacySettingsPanel from '../panels/privacy_settings.jsx';
import { route } from 'preact-router';
import { connect } from 'unistore/preact';

class PrivacySettings extends Component {
	constructor(props) {
		super(props);
		this.state = {
			message: '',
			warning: '' //TODO: unified warning?
		};
	}

	componentDidMount() {
		if (!this.props.account) {
			route('/login/', true);
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		let Panel;

		if (this.state.message) {
			Panel = () => <p className='centered'>{this.state.message}</p>
		} else {
			Panel = () => <PrivacySettingsPanel id={this.props.id} token={this.props.token} onSuccess={(msg) => this.setState({message: msg})} setWarning={this.setWarning.bind(this)} />;
		}

		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						
					</div>

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<h1 className='centered'>Privacy Settings</h1>
						<Panel />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};



export default connect('account')(PrivacySettings);