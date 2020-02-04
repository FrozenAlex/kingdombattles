import {Component, h} from 'preact';
import Markdown from 'markdown-to-jsx';
import Axios from 'axios';

class Markdown extends Component {
	constructor(props) {
		super(props);

		if (props.source !== undefined) {
			this.state = {
				data: props.source
			};
		} else {
			this.state = {
				data: ''
			};
			this.sendRequest(props.url);
		}
	}

	render() {
		if (this.state.data) {
			return (<Markdown children={this.state.data} {...this.props} />);
		} else {
			return (<p className='centered'>Loading markdown...</p>);
		}
	}

	async sendRequest(url, args = {}) {
		try {
			let response = await Axios.get(url, {
				params: args
			});
			this.setState({ data: response.data });
		} catch (e) {
			if (e.response && e.response.data) {
				this.props.setWarning(e.response.data)
			}	else{
				console.error(e)
			}
		}
	}
};

export default Markdown;