"use strict"
import Axios from 'axios';

// function automaticLogout() {
    Axios.interceptors.response.use(async function accepted(res) {
            return res;
        },
        async (err) => {
            if (err.response && err.response.status == 440) {
                console.log("Need to login again, probably the laziest implementation")
                let ITEM_NAME = 'account.kingdombattles';
                localStorage.removeItem(ITEM_NAME); // Logout if
                window.location.href="/"
            } else {
               return Promise.reject(err)   
            }
        })

// }

// module.exports = {
//     automaticLogout
// }