import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import BadgeListPanel from '../panels/badge_list.jsx';

class BadgeList extends Component {
	render() {
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<h1 className='centered'>Badges</h1>
						<BadgeListPanel getFetch={ (fn) => this.setState({ fetch: fn }) } />
					</div>
				</div>
			</div>
		);
	}
};

export default BadgeList;