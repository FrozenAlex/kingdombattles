import {Component, h} from 'preact';
import { Link } from 'preact-router';

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
			<div className='page centered' style={style}>
				<h1>Page Not Found</h1>
				<Link href='/'>Return Home</Link>
			</div>
		);
	}
};

export default PageNotFound;