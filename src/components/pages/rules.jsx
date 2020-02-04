import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import RawHTML from '../utilities/RawHTML.jsx';

class Rules extends Component {
	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<RawHTML html={require('../../assets/content/rules.md')}/>
					</div>
				</div>
			</div>
		);
	}
};

export default Rules;