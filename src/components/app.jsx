import { Component, h, VNode } from 'preact';
import { Switch, Router } from 'preact-router';
import AsyncRoute from 'preact-async-route';

import './../axios.js'

// Styles 
import '../styles/index.css';

import PageNotFound from './pages/page_not_found.jsx';
import Home from './pages/home.jsx';
import Navbar from './utilities/Navbar.jsx';

//the app class
export default class App extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className="siteWrapper">
				<Navbar/>
				<Router>
					{/* Include home by default since it's the first page */}
					<Home path='/'></Home>
					{/* Preload signup and login pages */}
					<AsyncRoute path='/signup/' getComponent={() =>  /* webpackPrefetch: true */ import('./pages/signup.jsx').then(module => module.default)} />
					<AsyncRoute path='/login/' getComponent={() => /* webpackPrefetch: true */ import('./pages/login.jsx').then(module => module.default)} />
					
					<AsyncRoute path='/tasklist/' getComponent={() => import('./pages/static/task_list.jsx').then(module => module.default)} />
					<AsyncRoute path='/news/' getComponent={() => import('./pages/news_index.jsx').then(module => module.default)} />
					<AsyncRoute path='/news/:postId' getComponent={() => import('./pages/news.jsx').then(module => module.default)} />
					<AsyncRoute path='/privacypolicy/' getComponent={() => import('./pages/static/privacy_policy.jsx').then(module => module.default)} />
					<AsyncRoute path='/patrons/' getComponent={() => import('./pages/static/patron_list.jsx').then(module => module.default)} />
					<AsyncRoute path='/rules/' getComponent={() => import('./pages/rules.jsx').then(module => module.default)} />

					<AsyncRoute path='/ladder/' getComponent={() => import('./pages/ladder.jsx').then(module => module.default)} />
					<AsyncRoute path='/statistics/' getComponent={() => import('./pages/statistics.jsx').then(module => module.default)} />


					<AsyncRoute path='/badges/list/' getComponent={() => import('./pages/badge_list.jsx').then(module => module.default)} />
					<AsyncRoute path='/badges/' getComponent={() => import('./pages/badge_select.jsx').then(module => module.default)} />

					{/* Password recovery */}
					<AsyncRoute path='/passwordchange/' getComponent={() => import('./pages/password_change.jsx').then(module => module.default)} />
					<AsyncRoute path='/passwordrecover/' getComponent={() => import('./pages/password_recover.jsx').then(module => module.default)} />
					<AsyncRoute path='/passwordreset/' getComponent={() => import('./pages/password_reset.jsx').then(module => module.default)} />
					<AsyncRoute path='/badges/' getComponent={() => import('./pages/badge_select.jsx').then(module => module.default)} />

					{/* Profile */}
					<AsyncRoute path='/profile/' getComponent={() => import('./pages/profile.jsx').then(module => module.default)} />
					<AsyncRoute path='/profile/:username' getComponent={() => import('./pages/profile.jsx').then(module => module.default)} />

					<AsyncRoute path='/equipment/' getComponent={() => import('./pages/equipment.jsx').then(module => module.default)} />
					<AsyncRoute path='/ladder/' getComponent={() => import('./pages/ladder.jsx').then(module => module.default)} />
					<AsyncRoute path='/combatlog/' getComponent={() => import('./pages/combat_log.jsx').then(module => module.default)} />
					<AsyncRoute path='/spyinglog/' getComponent={() => import('./pages/spying_log.jsx').then(module => module.default)} />

					<AsyncRoute path='/privacysettings/' getComponent={() => import('./pages/privacy_settings.jsx').then(module => module.default)} />

					<PageNotFound default></PageNotFound>
				</Router>
			</div>
		);
	}
}