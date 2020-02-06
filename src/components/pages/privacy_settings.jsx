import { Component, h } from "preact";

//panels
import { route } from "preact-router";
import { connect } from "unistore/preact";
import Axios from "axios";

class PrivacySettings extends Component {
	constructor(props) {
		super(props);
		this.state = {
			message: "",
			warning: "" //TODO: unified warning?
		};
		this.state = {
			promotions: false
		};
	}

	componentDidMount() {
		if (!this.props.account) {
			route("/login/", true);
			this.getPrivacySettings();
		}
	}

	render() {
		return (
			<MainLayout>
				<form
					className="table noCollapse"
					action="/api/account/privacy"
					method="post"
					onSubmit={this.submit.bind(this)}
				>
					<hr />
					<div className="break" />

					<div className="row">
						<label className="col" htmlFor="promotions">
							Allow Emails:
						</label>
						<input
							className="col"
							id="promotions"
							type="checkbox"
							name="promotions"
							checked={this.state.promotions}
							onChange={this.updatePromotions.bind(this)}
						/>
						<div className="col double mobile hide" />
					</div>

					<div className="break" />

					<div className="row">
						<button className="col" type="submit">
							Update Privacy Settings
						</button>
						<div className="col mobile hide" />
						<div className="col double mobile hide" />
					</div>
				</form>
			</MainLayout>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}

	//TODO: Fix this copy/pasted crap
	//gameplay functions
	async sendRequest(url, args = {}) {
		//send a unified request, using my credentials
		//build the XHR
		let result = await Axios.post(url, args);

		let json = result.data;
		this.setState({
			promotions: json.promotions
		});
	}

	async getPrivacySettings() {
		let result = await Axios.get("/api/account/privacy");

		this.setState({
			promotions: result.data.promotions
		});
	}

	clearInput() {
		this.setState({ promotions: false });
	}

	updatePromotions(evt) {
		this.setState({ promotions: !this.state.promotions });
	}
}

export default connect("account")(PrivacySettings);
