import { Component, h } from "preact";
import { Link } from "preact-router";
import queryString from "query-string";

//panels
import MainLayout from "../layouts/MainLayout.jsx";

class PasswordReset extends Component {
	constructor(props) {
		super(props);
		this.state = {
			reset: "",
			params: queryString.parse(props.location.search)
		};
	}

	render() {
		return (
			<MainLayout>
				<Link href="/" className="centered">
					Return Homes
				</Link>
			</MainLayout>
		);
	}
}

export default PasswordReset;
