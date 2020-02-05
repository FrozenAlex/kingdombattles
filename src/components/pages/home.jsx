import { Component, h } from 'preact';
import { Link } from 'preact-router';

//panels
import CommonLinks from '../panels/common_links.jsx';
import News from '../panels/news.jsx';
import Markdown from 'markdown-to-jsx'
import RawHTML from '../utilities/RawHTML.jsx';

class Home extends Component {
	constructor(props) {
		super(props);
		this.state = {
			warning: '', //TODO: unified warning?
			fetch: null,
			tagline: ''
		};

		fetch('/api/tagline')
			.then(res => res.text())
			.then(text => this.setState({ tagline: text }))
			.catch(console.error)
		;
	}

	render() {
		let warningStyle = {
			display: this.state.warning.length > 0 ? 'flex' : 'none'
		};

		//A bit of fun
		let Tagline = () => {
			if (this.state.tagline === 'marquee') {
				return (<div className='marqueeContainer'><em><p className='marquee'>Why I hope this CSS marquee effect works in all browsers!</p></em></div>);
			}
			if (this.state.tagline === 'rainbow') {
				return (<em><p className='centered rainbowText'>I hope this CSS rainbow effect works in all browsers!</p></em>);
			}
			return (<div className='centered'><em><Markdown children={this.state.tagline} /></em></div>);
		}

		return (
			<div className='page'>
			
						<a className='banner center' href='/'>
						<img src={require('../../assets/img/flag_scaled.png').default} /></a>
						<div className='warning' style={warningStyle}>
							<p>{this.state.warning}</p>
						</div>
						<h1 className='centered'>About</h1>
						<Tagline />
						<br />
						<RawHTML style={{width:'90%', overflow:'line-wrap'}} html={require('./../../assets/content/blurb.md')}></RawHTML>
						<h1 className='centered'>News</h1>
						<News length={3}/>
						<p className='right'><Link href='/news/'>See all news...</Link></p>
					
				
			</div>
		);
	}

	setWarning(s) {
		this.setState({ warning: s });
	}
};

export default Home;