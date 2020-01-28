import React from 'react';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown/with-html';
import Axios from 'axios';

class Markdown extends React.Component {
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
			return (<ReactMarkdown source={this.state.data} escapeHtml={false} {...this.props} />);
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

Markdown.propTypes = {
	source: PropTypes.string,
	url: PropTypes.string,
	setWarning: PropTypes.func
};

export default Markdown;