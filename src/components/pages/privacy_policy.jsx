import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import RawHTML from '../utilities/RawHTML.jsx';

class PrivacyPolicy extends Component { //NOTE: react isn't liking the generic markdown_page.jsx class
	render() {
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<RawHTML html={require('../../assets/content/privacy_policy.md')}></RawHTML>
					</div>
				</div>
			</div>
		);
	}
};

export default PrivacyPolicy;