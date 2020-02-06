import { Component, h } from "preact";

//panels
import NewsPanel from "../panels/news.jsx";
import MainLayout from "../layouts/MainLayout.jsx"

class News extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: "", //TODO: unified warning?
			fetch: null
		};
		console.log(this);
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? "flex" : "none"
		};

		return (
			<MainLayout>
				<div className="warning" style={warningStyle}>
					<p>{this.state.warning}</p>
				</div>

				<NewsPanel
					setWarning={this.setWarning.bind(this)}
					postId={this.props.matches.postId}
				/>
			</MainLayout>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
}

export default News;
