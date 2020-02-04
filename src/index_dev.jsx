import { h, Component, render } from 'preact';



// Clear console on each reload
if (module.hot) {
    module.hot.accept() // already had this init code 

    module.hot.addStatusHandler(status => {
        if (status === 'prepare') console.clear()
    })
}