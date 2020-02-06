import { Component, h } from "preact";
import { Link, route } from "preact-router";

//panels
import Badge from './../panels/badge.jsx';
import BadgeList from '../../assets/badges.js'
import Axios from 'axios';

import { connect } from "unistore/preact";
import MainLayout from "../layouts/MainLayout.jsx";

class BadgeSelect extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: "", //TODO: unified warning?
			badges: BadgeList,
			owned: null
		};
	}

	componentDidMount() {
		if (!this.props.account) {
			route("/login/", true);
		} else {
			this.getOwnedBadges()
		}
	}

	render() {
		if (!this.state.owned) {
			return (
				<p className='panel'>Loading badges...?</p>
			);
		}

		let warningStyle = {
			display: this.state.warning.length > 0 ? "flex" : "none"
		};

		//are none selected?
		let anySelected = Object.keys(this.state.owned).reduce(
			(accumulator, name) => accumulator || this.state.owned[name].active,
			false
		);

		return (
			<MainLayout>
				<div className="page">
					<div className="sidePanelPage">
						<div className="mainPanel">
							<div className="warning" style={warningStyle}>
								<p>{this.state.warning}</p>
							</div>

							<h1 className="centered">Badge Select</h1>
							<p className="centered">
								Click on your favourite badge!{" "}
								<Link href="/badges/list/">Full list here</Link>.
							</p>
							<div className="panel table">
								<div key={name}>
									<div
										className={`panel row${!anySelected ? " highlight" : ""}`}
										style={{ padding: 10, minHeight: 120 }}
										onClick={() => this.setActiveBadge(null)}
									>
										<p className={"col centered"} style={{ alignSelf: "center" }}>
											No Badge
										</p>
									</div>
									<div className="row">
										<hr className="col mobile show" />
									</div>
								</div>

								{Object.keys(this.state.owned)
									.map(name => (
										<div key={name}>
											<div
												className={`panel row${
													this.state.owned[name].active ? " highlight" : ""
												}`}
												style={{ padding: 10 }}
												onClick={() => this.setActiveBadge(name)}
											>
												<div className={"col centered"} style={{ minWidth: 110 }}>
													<Badge
														name={name}
														filename={this.state.badges[name].filename}
													/>
												</div>
												<p className={"col"} style={{ flex: 4, alignSelf: "center" }}>
													{this.state.badges[name].description}
												</p>
											</div>
											<div className="row">
												<hr className="col mobile show" />
											</div>
										</div>
									))
									.reverse()}
							</div>
						</div>
					</div>
				</div>
			</MainLayout>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}

	//gameplay functions
	async setActiveBadge(name) {
		let response = await Axios.post("/api/game/badges/active", { name: name });
		this.setState({
			...this.state,
			owned: response.data
		});
	}
	async getOwnedBadges() {
		//send a unified request, using my credentials
		let response = await Axios.post("/api/game/badges/owned");
		//on success
		this.setState({
			...this.state,
			owned: response.data
		});
	}
}

export default connect("account")(BadgeSelect);
