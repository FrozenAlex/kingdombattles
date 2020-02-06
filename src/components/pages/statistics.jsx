import { Component, h } from "preact";

//panels
import Axios from "axios";
import MainLayout from "../layouts/MainLayout.jsx";

class Statistics extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: "", //TODO: unified warning?
			fetch: null,
			data: {}
		};
	}

	componentDidMount() {
		this.sendRequest('/api/game/stats/');
	}

	render() {
		return (
			<MainLayout>
				<h1 className="centered">Game Statistics</h1>
				<div className="panel table noCollapse">
					{Object.keys(this.state.data).map(key => (
						<div key={key} className="row">
							<p className="col">{key}:</p>
							<p className="col">
								{typeof this.state.data[key] === "object" ? (
									<span style={{ color: this.state.data[key].color }}>
										{this.state.data[key].string}
									</span>
								) : (
									<span>{this.state.data[key]}</span>
								)}
							</p>
							<div className="col mobile hide" />
						</div>
					))}
				</div>
			</MainLayout>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
	async sendRequest(url, args = {}) {
		try {
			let response = await Axios.post(url, args);
			this.setState({ data: response.data });
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data);
			} else {
				console.error(e);
			}
		}
	}
}

export default Statistics;
