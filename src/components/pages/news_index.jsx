import React from 'react';
import { withRouter, Link } from 'react-router-dom';

//panels
import CommonLinks from '../panels/common_links.jsx';
import Axios from 'axios';

class NewsIndex extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			data: {},
			warning: '' //TODO: unified warning?
		};

		this.getNews('/api/news/headers');
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

						<ul className='panel'>
							{Object.keys(this.state.data).map((fname) => <li key={fname} style={{paddingBottom: '0.5em'}}><Link to={`/news/${fname}`}>{fname}</Link> - {this.state.data[fname].firstline}</li>).reverse()}
						</ul>
					</div>
				</div>
			</div>
		);
	}

	async getNews(url, args = {}) { //send a unified request, using my credentials
		let news = await Axios.get('/api/news/headers');
		this.setState({ data: news.data });
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default withRouter(NewsIndex);