// import "preact/debug";
// import "preact/devtools";

import { h, Component, render } from 'preact';

import createStore from 'unistore'
import { Provider } from 'unistore/preact'
import devtools from 'unistore/devtools'


import App from './components/app.jsx';

//persistence
let ITEM_NAME = 'account.kingdombattles';
let account = localStorage.getItem(ITEM_NAME);
account = account ? JSON.parse(account) : null; // Make it null to simplify the logic

// Profile persists too xD
let profile = localStorage.getItem("profile.kingdombattles");
profile = profile ? JSON.parse(profile) : null;

let initialState = { account: account, profile:profile}

let store = devtools(createStore(initialState));

// //persistence
store.subscribe(() => {
	localStorage.setItem(ITEM_NAME, JSON.stringify(store.getState().account));
	localStorage.setItem("profile.kingdombattles", JSON.stringify(store.getState().profile));
});


//start the process
render(
	<Provider store={store}>
		<div>
			<App />
		</div>
	</Provider>,
	document.querySelector("#root")
);

// Clear console on each reload
if (module.hot) {
    module.hot.accept() // already had this init code 

    module.hot.addStatusHandler(status => {
        if (status === 'prepare') console.clear()
    })
}