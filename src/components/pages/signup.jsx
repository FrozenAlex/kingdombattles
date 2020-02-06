import { Component, h } from "preact";
import { Link } from "preact-router";

//panels
import {validateEmail} from '../../../common/utilities.js'
import FullscreenLayout from "../layouts/FullscreenLayout.jsx";
import Axios from "axios";

class Signup extends Component {
	constructor(props) {
		super(props);
		this.state = {
			email: "",
			username: "",
			password: "",
			retype: "",
			promotions: false,
			warning: ""
		};
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? "flex" : "none"
		};

		let Panel;

		if (!this.state.signedUp) {
			Panel = () => {
				return <SignupPanel onSuccess={msg => this.setState({ signedUp: msg })} />;
			};
		} else {
			Panel = () => {
				return <p className="centered">{this.state.signedUp}</p>;
			};
		}

		return (
			<FullscreenLayout>
				<form class="max-w-sm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mx-auto ml-auto mr-auto max-w-lg">
					<h1 className="text-gray-800 centered text-2xl font-bold p-4">Register</h1>
					<div class="mb-4">
						<label class="block text-gray-700 text-sm font-bold mb-2" for="email">
							Email
						</label>
						<input
							value={this.state.email}
							onChange={this.updateEmail.bind(this)}
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							id="email"
							type="text"
							placeholder="Email"
						/>
					</div>
					<p
						class={`${
							!validateEmail(this.state.email) ? "text-red-600" : "hidden"
						} text-xs italic mt-2`}
					>
						Email is not valid
					</p>

					<div class="mb-4">
						<label class="block text-gray-700 text-sm font-bold mb-2" for="username">
							Username
						</label>
						<input
							class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							id="username"
							type="text"
							placeholder="Username"
							value={this.state.username}
							onChange={this.updateUsername.bind(this)} 
						/>
					</div>
					<p
								class={`${
									this.state.username.length < 4 ? "text-red-600" : "hidden"
								} text-xs mt-2 italic`}
							>
								Username needs to have at least 4 characters
							</p>
					<div class="flex flex-wrap -mx-3 mb-6">
						<div class="w-full px-3">
							<label
								class="block text-gray-700 text-sm font-bold mb-2"
								for="grid-password"
							>
								Password
							</label>
							<input
								class=" shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="grid-password"
								type="password"
								placeholder="********"
								value={this.state.password}
								onChange={this.updatePassword.bind(this)}
							/>
							<p
								class={`${
									this.state.password.length < 8 ? "text-red-600" : "hidden"
								} text-xs mt-2 italic`}
							>
								Password needs to have at least 8 characters
							</p>
						</div>
					</div>
					<div class="flex flex-wrap -mx-3 mb-6">
						<div class="w-full px-3">
							<label
								class="block text-gray-700 text-sm font-bold mb-2"
								for="grid-password-repeat"
							>
								Repeat the password
							</label>
							<input
								class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
								id="grid-password-repeat"
								type="password"
								placeholder="********"
								value={this.state.retype}
								onChange={this.updateRetype.bind(this)}
							/>
							<p
								class={`${
									this.state.password !== this.state.retype
										? "text-red-700"
										: "text-green-600"
								} text-xs mt-2 italic`}
							>
								Passwords {this.state.password !== this.state.retype ? "do not" : ""}{" "}
								match
							</p>
						</div>
					</div>
					<div class="md:flex md:items-center mb-6">
						<div class="md:w-1/3"></div>
						<label class="md:w-2/3 block text-gray-500 font-bold">
							<input
								class="mr-2 leading-tight"
								type="checkbox"
								value={this.state.promotions}
								onChange={this.updatePromotions.bind(this)}
							/>
							<span class="text-sm">Allow promotional emails</span>
						</label>
					</div>
					<button
						class="mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						onClick={e => this.submit(e)}
					>
						Sign Up
					</button>
				</form>
			</FullscreenLayout>
		);
	}
	async submit(e) {
		e.preventDefault();

		if (!this.validateInput()) {
			return;
		}

		let result = await Axios.post('/api/account/signup', {
			email: this.state.email,
			username: this.state.username,
			password: this.state.password,
			promotions: this.state.promotions,
		});

		if (result.status === 200) {
			alert("Email was sent to your inbox!")
			this.clearInput();
		} else {
			alert("something went wrong")
		}
	}

	validateInput() {
		if (!validateEmail(this.state.email)) {
			this.setWarning("Invalid Email");
			return false;
		}
		if (this.state.username.length < 4) {
			this.setWarning("Minimum username length is 4 characters");
			return false;
		}
		if (this.state.username.length > 100) {
			this.setWarning("Maximum username length is 100 characters");
			return false;
		}
		if (this.state.password.length < 8) {
			this.setWarning("Minimum password length is 8 characters");
			return false;
		}
		if (this.state.password !== this.state.retype) {
			this.setWarning("Passwords do not match");
			return false;
		}

		return true;
	}

	setWarning(s) {
		this.setState({ warning: s });
	}

	clearInput() {
		this.setState({
			email: "",
			username: "",
			password: "",
			retype: "",
			promotions: false,
			warning: ""
		});
	}

	updateEmail(evt) {
		this.setState({ email: evt.target.value });
	}

	updateUsername(evt) {
		this.setState({ username: evt.target.value });
	}

	updatePassword(evt) {
		this.setState({ password: evt.target.value });
	}

	updateRetype(evt) {
		this.setState({ retype: evt.target.value });
	}

	updatePromotions(evt) {
		this.setState({ promotions: evt.target.value });
	}
}

export default Signup;
