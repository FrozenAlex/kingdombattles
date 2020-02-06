import {Component, h} from 'preact';
import { Link } from 'preact-router';
import MainLayout from '../layouts/MainLayout.jsx';


class PageNotFound extends Component {
	constructor(props) {
		super(props);
		this.state = {
			//
		};
	}

	render() {
		let style = {
			justifyContent: 'center'
		};

		return (
			<MainLayout>
				<h1>Page Not Found</h1>
				<Link href='/'>Return Home</Link>
				</MainLayout>
		);
	}
};

export default PageNotFound;