import React from 'react';
import ReactMarkdown from 'react-markdown/with-html';
import PropTypes from 'prop-types';
import Axios from 'axios';

// Multipurpose news container
class News extends React.Component {
	constructor(props) {
		super(props);

		this.state = {
			news: null
		};
	}

	componentDidMount() {
		// If it's called with 
		if (this.props.postId) {
			this.getNewsArticle(this.props.postId)
		} else {
			this.getNews(this.props.length)
		}
	}

	render() {
		if (!this.state.news) {
			return (
				<div className='panel centered'>
					Loading news for you..
				</div>
			)
		}

		return (
			<div className='panel'>
				{Object.keys(this.state.news).map((key) => <div key={key}>
					<ReactMarkdown source={this.state.news[key]} escapeHtml={false} />
					<hr className='newsLine' />
				</div>)}
			</div>
		);
	}

	// Gets the list of news
	async getNews(length) {
		let news = await Axios.get('/api/news', {
			params: {  length:length || 4 }
		});
		this.setState({ news: news.data });
	}
	// Gets the article
	async getNewsArticle(id) {
		let news = await Axios.get(`/content/news/${id}`)
		this.setState({ news: [news.data] });
	}
};

News.propTypes = {
	length: PropTypes.number
};

export default News;