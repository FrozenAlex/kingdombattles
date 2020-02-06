import { Component, h } from "preact";

import MainLayout from "../layouts/MainLayout.jsx";
import Badge from "../panels/badge.jsx";
import PossibleBadges from "./../../assets/badges.js";

class BadgeList extends Component {
	constructor(props) {
		super(props);

		this.state = {
			data: {
				badges: PossibleBadges
			}
		};
	}

	render() {
		return (
			<MainLayout>
				<h1>Badges</h1>
				<div>
					{Object.keys(this.state.data.badges).map(name => (
						<div key={name}>
							<div className={"panel row"} style={{ padding: 10 }}>
								<div className={"col centered"} style={{ minWidth: 110 }}>
									<Badge name={name} filename={this.state.data.badges[name].filename} />
								</div>
								<div
									className={"col"}
									style={{
										flex: 4,
										display: "flex",
										flexDirection: "column",
										justifyContent: "center"
									}}
								>
									<h2>{name}</h2>
									<p>{this.state.data.badges[name].description}</p>
									<p>
										Unlockable:{" "}
										{this.state.data.badges[name].unlockable ? (
											<span style={{ color: "lightgreen" }}>Yes</span>
										) : this.state.data.badges[name].unlockable === null ? (
											<span style={{ color: "yellow" }}>Coding Incomplete</span>
										) : (
											<span style={{ color: "red" }}>No</span>
										)}
									</p>
								</div>
							</div>
							<div className="row">
								<hr className="col mobile show" />
							</div>
						</div>
					))}
				</div>
			</MainLayout>
		);
	}
}

export default BadgeList;
