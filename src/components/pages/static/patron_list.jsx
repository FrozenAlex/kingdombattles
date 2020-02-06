import { Component, h } from "preact";

//panels
import RawHTML from "../../utilities/RawHTML.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";

class PatronList extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: ""
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? "flex" : "none"
		};

		return (
			<MainLayout>
				<h1 className="centered">My Patrons On Patreon</h1>
				<p className="centered">
					You can become a patron <a href="https://www.patreon.com/krgamestudios">here</a>
					.
				</p>
				<RawHTML html={require("../../../assets/content/patron_list.md")}></RawHTML>
			</MainLayout>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
}

export default PatronList;
