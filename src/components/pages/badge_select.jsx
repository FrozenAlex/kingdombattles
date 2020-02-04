import {Component, h} from 'preact';
import { Link, route } from 'preact-router';

//panels
import CommonLinks from '../panels/common_links.jsx';
import BadgeSelectPanel from '../panels/badge_select.jsx';
import { connect } from 'unistore/preact';

class BadgeSelect extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null
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

		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<h1 className='centered'>Badge Select</h1>
						<p className='centered'>Click on your favourite badge! <Link href='/badges/list/'>Full list here</Link>.</p>
						<BadgeSelectPanel setWarning={this.setWarning.bind(this)} getFetch={ (fn) => this.setState({ fetch: fn }) } />
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};


export default connect('account')(BadgeSelect);