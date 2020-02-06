import { Component, h } from "preact";
import { Link, route } from "preact-router";
import { connect } from 'unistore/preact'

// Libs
import Axios from 'axios';
import { validateEmail } from '../../../common/utilities.js';

// Layout
import FullscreenLayout from "../layouts/FullscreenLayout.jsx";

// Actions
import { actions } from '../../actions/index.js';

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      warning: ""
    };
  }

  render() {
    return (
     <FullscreenLayout>
        <form
          onSubmit={this.submit.bind(this)}
          action="/api/account/login"
          method="post"
          class="max-w-sm bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 mx-auto"
        >
          <h1 className="text-gray-800 centered text-2xl font-bold">Login</h1>
          <div class="mb-4">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="email"
            >
              Email
            </label>
            <input
              value={this.state.email}
              onChange={this.updateEmail.bind(this)}
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="text"
              placeholder="Username"
            />
          </div>
          <div class="mb-6">
            <label
              class="block text-gray-700 text-sm font-bold mb-2"
              for="password"
            >
              Password
            </label>
            <input
              class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="******************"
              value={this.state.password}
              onInput={this.updatePassword.bind(this)}
            />
          </div>
          <div class="flex items-center justify-between">
            <button
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              type="button"
              onClick={e => this.submit(e)}
            >
              Sign In
            </button>
            <a
              class="inline-block align-baseline font-bold text-sm text-blue-500 hover:text-blue-800"
              href="#"
            >
              Forgot Password?
            </a>
          </div>
          <div class="flex items-center justify-between">
            <a
              href="/api/account/social/google"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Login with Google
            </a>
          </div>
        </form>
        <p class="text-center text-gray-500 text-xs">
          &copy;2020 KR Game Studios. All rights reserved.
        </p>
      </FullscreenLayout>
    );
  }

  async submit(e) {
    // e.preventDefault();
    if (!this.validateInput()) {
      return;
    }

    let result = await Axios.post("/api/account/login", {
      email: this.state.email,
      password: this.state.password
    });

    let json = result.data;
    console.log("Current props", this);
    this.props.login(json.id, json.email, json.username);

    route("/", true);
  }

  validateInput(e) {
    if (!validateEmail(this.state.email)) {
      this.setWarning("Invalid Email");
      return false;
    }

    if (this.state.password.length < 8) {
      this.setWarning("Minimum password length is 8 characters");
      return false;
    }

    return true;
  }

  setWarning(s) {
    this.setState({ warning: s });
  }

  clearInput() {
    this.setState({ email: "", password: "", warning: "" });
  }

  updateEmail(evt) {
    this.setState({ email: evt.target.value });
  }

  updatePassword(evt) {
    this.setState({ password: evt.target.value });
  }
}

export default connect(['account'], actions)(Login);
