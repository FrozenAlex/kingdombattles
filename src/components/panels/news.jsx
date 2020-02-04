import { h, Component } from 'preact';
import Markdown from 'markdown-to-jsx';
import Axios from 'axios';

// Multipurpose news container
class News extends Component {
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
					<Markdown children={this.state.news[key]}/>
					<hr className='newsLine' />
				</div>)}
			</div>
		);
	}

	// Gets the list of news
	async getNews(length) {
		let news = await Axios.get('/api/news', {
			params: { length: length || 4 }
		});
		this.setState({ news: news.data });
	}
	// Gets the article
	async getNewsArticle(id) {
		let news = await Axios.get(`/content/news/${id}`)
		this.setState({ news: [news.data] });
	}
};


export default News;