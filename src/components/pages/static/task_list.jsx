import { Component, h } from "preact";

//panels
import RawHTML from "../../utilities/RawHTML.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";

class TaskList extends Component {
	render() {
		return (
			<MainLayout>
				<h1 className="centered">Kingdom Battles Developer Task List</h1>
				<RawHTML html={require("./../../../assets/content/task_list.md")} />
			</MainLayout>
		);
	}
}

export default TaskList;
