import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import RawHTML from '../utilities/RawHTML.jsx';

class TaskList extends Component {
	render() {
		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<h1 className='centered'>Kingdom Battles Developer Task List</h1>
						<RawHTML html={require('./../../assets/content/task_list.md')}/>
					</div>
				</div>
			</div>
		);
	}
};

export default TaskList;