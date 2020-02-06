import { Component, h } from "preact";
import queryString from "query-string";
import PropTypes from "prop-types";

//panels
import CommonLinks from "../panels/common_links.jsx";
import PagedCombatLog from "../panels/paged_combat_log.jsx";
import { route } from "preact-router";
import { connect } from "unistore/preact";
import MainLayout from "../layouts/MainLayout.jsx";

class CombatLog extends Component {
	constructor(props) {
		super(props);

		let params = queryString.parse(props.url);

		this.state = {
			params: params,
			start: parseInt(params.log) || 0,
			length: parseInt(params.length) || 20,

			fetch: null,

			warning: ""
		};
	}

	componentDidMount() {
		if (!this.props.account) {
			route("/login/", true);
		}
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? "flex" : "none"
		};

		let ButtonHeader = this.buttonHeader.bind(this);

		return (
			<MainLayout>
				<h1 className="centered mb-3">Attack  log</h1>
				<ButtonHeader />
				<PagedCombatLog
					setWarning={this.setWarning.bind(this)}
					start={this.state.start}
					length={this.state.length}
					onReceived={this.onReceived.bind(this)}
				/>
				<ButtonHeader />
			</MainLayout>
		);
	}

	buttonHeader() {
		return (
			<div className="table noCollapse">
				<div className="row">
					<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={this.decrement.bind(this)}>
						&lt; Back
					</button>
					<div className="col hide mobile" />
					<div className="col hide mobile" />
					<button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" onClick={this.increment.bind(this)}>
						Next &gt;
					</button>
				</div>
			</div>
		);
	}

	increment() {
		let start = this.state.start + this.state.length;

		route(`${this.props.path}?log=${start}`, true);
	}

	decrement() {
		let start = Math.max(0, this.state.start - this.state.length);

		//don't decrement too far
		if (start === this.state.start) {
			return;
		}
		route(`${this.props.path}?log=${start}`, true);
	}

	onReceived(data) {
		if (data.length === 0) {
			let start = Math.max(0, this.state.start - this.state.length);

			//don't decrement too far
			if (start === this.state.start) {
				return;
			}

			route(`${this.props.location.pathname}?log=${start}`, true);
		}
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
}

export default connect("account")(CombatLog);
