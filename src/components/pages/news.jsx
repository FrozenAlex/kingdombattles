import {Component, h} from 'preact';

//panels
import CommonLinks from '../panels/common_links.jsx';
import NewsPanel from '../panels/news.jsx';

class News extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null
		};
		console.log(this)
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		return (
			<div className='page'>
				<div className='sidePanelPage'>
					<div className='sidePanel'>
						<CommonLinks />
					</div>

					<div className='mainPanel'>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>

						<NewsPanel
							setWarning={this.setWarning.bind(this)}
							postId={this.props.matches.postId}
						/>
					</div>
				</div>
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default News;