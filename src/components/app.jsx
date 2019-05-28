import React from 'react';
import { BrowserRouter, Switch, Route } from 'react-router-dom';
import Loadable from 'react-loadable';

//other stuff
import Footer from './panels/footer.jsx';

//lazy route loading
const LazyRoute = (props) => {
	const component = Loadable({
		loader: props.component,
		loading: () => <div className='page'><p className='centered'>Loading...</p></div>,
	});

	return <Route {...props} component={component} />;
};

//the app class
export default class App extends React.Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className = 'central'>
				<img className='banner' src={'/img/flag_scaled.png'} />
				<BrowserRouter>
					<Switch>
						<LazyRoute exact path='/' component={() => import('./pages/home.jsx')} />
						<LazyRoute path='/signup' component={() => import('./pages/signup.jsx')} />
						<LazyRoute path='/login' component={() => import('./pages/login.jsx')} />
						<LazyRoute path='/passwordchange' component={() => import('./pages/password_change.jsx')} />
						<LazyRoute path='/passwordrecover' component={() => import('./pages/password_recover.jsx')} />
						<LazyRoute path='/passwordreset' component={() => import('./pages/password_reset.jsx')} />

						<LazyRoute path='/profile' component={() => import('./pages/profile.jsx')} />
						<LazyRoute path='/ladder' component={() => import('./pages/ladder.jsx')} />

						<LazyRoute path='*' component={() => import('./pages/page_not_found.jsx')} />
					</Switch>
				</BrowserRouter>
				<Footer />
			</div>
		);
	}
}