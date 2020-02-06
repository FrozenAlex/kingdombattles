import { Component, h } from "preact";
import { Link } from "preact-router";

//panels
import MainLayout from "../layouts/MainLayout.jsx";
import FullscreenLayout from "../layouts/FullscreenLayout.jsx";

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
					<div class="flex flex-wrap -mx-3 mb-6">
						<div class="w-full md:w-1/2 px-3 mb-6 md:mb-0">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-first-name"
							>
								First Name
							</label>
							<input
								class="appearance-none block w-full bg-gray-200 text-gray-700 border border-red-500 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white"
								id="grid-first-name"
								type="text"
								placeholder="Jane"
							/>
							<p class="text-red-500 text-xs italic">Please fill out this field.</p>
						</div>
						<div class="w-full md:w-1/2 px-3">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-last-name"
							>
								Last Name
							</label>
							<input
								class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-last-name"
								type="text"
								placeholder="Doe"
							/>
						</div>
					</div>
					<div class="flex flex-wrap -mx-3 mb-6">
						<div class="w-full px-3">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-password"
							>
								Password
							</label>
							<input
								class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 mb-3 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-password"
								type="password"
								placeholder="******************"
							/>
							<p class="text-gray-600 text-xs italic">
								Make it as long and as crazy as you'd like
							</p>
						</div>
					</div>
					<div class="flex flex-wrap -mx-3 mb-2">
						<div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-city"
							>
								City
							</label>
							<input
								class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-city"
								type="text"
								placeholder="Albuquerque"
							/>
						</div>
						<div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-state"
							>
								State
							</label>
							<div class="relative">
								<select
									class="block appearance-none w-full bg-gray-200 border border-gray-200 text-gray-700 py-3 px-4 pr-8 rounded leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
									id="grid-state"
								>
									<option>New Mexico</option>
									<option>Missouri</option>
									<option>Texas</option>
								</select>
								<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
									<svg
										class="fill-current h-4 w-4"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
									>
										<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
									</svg>
								</div>
							</div>
						</div>
						<div class="w-full md:w-1/3 px-3 mb-6 md:mb-0">
							<label
								class="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
								for="grid-zip"
							>
								Zip
							</label>
							<input
								class="appearance-none block w-full bg-gray-200 text-gray-700 border border-gray-200 rounded py-3 px-4 leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
								id="grid-zip"
								type="text"
								placeholder="90210"
							/>
						</div>
					</div>
					<button
						class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded focus:outline-none focus:shadow-outline"
						type="button"
						onClick={e => this.submit(e)}
					>
						Sign Up
					</button>
				</form>
			</FullscreenLayout>
		);
	}
	submit(e) {
		e.preventDefault();

		if (!this.validateInput()) {
			return;
		}

		//build the XHR
		let form = e.target;
		let formData = new FormData(form);

		let xhr = new XMLHttpRequest();

		xhr.onreadystatechange = () => {
			if (xhr.readyState === 4) {
				if (xhr.status === 200) {
					let json = JSON.parse(xhr.responseText);

					if (this.props.onSuccess) {
						this.props.onSuccess(json.msg);
					}
				} else if (xhr.status === 400) {
					this.setWarning(xhr.responseText);
				}
			}
		};

		//send the XHR
		xhr.open("POST", form.action, true);
		xhr.send(formData);

		this.clearInput();
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
