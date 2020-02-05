import { Component, h, Fragment } from 'preact';
import { Link } from 'preact-router';
import { connect } from 'unistore/preact';
import Axios from 'axios';
import { actions } from '../../actions';

/**
 * Renders html in html prop
 */
class Navbar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: true
        }
    }
    render() {
        return (

            <nav class="w-full fixed flex items-center justify-between flex-wrap bg-indigo-900 p-3 border-b-2 border-blue-800">
                <div class="flex items-center sm-flex-shrink-1 flex-shrink-0 text-white mr-6 h-10">
                    <Link href="/"><img class="h-10 mr-2" src={require('../../assets/img/flag_scaled.png').default} /></Link>
                </div>
                <div class="block lg:hidden">
                    <button onClick={() => this.setState({ open: !this.state.open })} class="flex items-center px-3 py-3 text-white-200 border-white-400 hover:text-white hover:border-white">
                        <svg class="fill-current h-4 w-4" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z" /></svg>
                    </button>
                </div>

                <div className={`${(this.state.open) ? "" : "hidden"} w-full block flex-grow lg:flex lg:items-center s:items-center lg:w-auto`}>
                    <div class=" flex text-sm lg:flex-grow flex-wrap s:justify-between">

                        {(this.props.account) ? this.loggedInLinks() : this.loggedOutLinks()}
                    </div>
                    <div>
                        {(this.props.account) ?
                            <a href="#" class="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-100 hover:bg-white mt-4 lg:mt-0" onClick={() => this.logout()}>Logout</a> :
                            <a class="inline-block text-sm px-4 py-2 leading-none border rounded text-white border-white hover:border-transparent hover:text-teal-500 hover:bg-white mt-4 lg:mt-0" href="/login">Login</a>}
                    </div>
                </div>
            </nav>
        )
    }

    loggedOutLinks() {
        return (
            <Fragment>
                <Link href="/signup/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                    Signup
                </Link>
                <Link href="/statistics/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                    Game statistics
                </Link>
                <Link href="/ladder/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                    Leaderboard
                </Link>
                <Link href="/rules/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                    Rules
                </Link>
            </Fragment>
        )
    }

    loggedInLinks() {
        return (<Fragment>
            <Link href="/profile/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                Kingdom
            </Link>
            <Link href="/equipment/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-200 hover:text-white mr-4">
                Equipment
                            </Link>
            <Link href="/badges/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-500 hover:text-white  mr-4">
                Badges
                            </Link>
            <Link href="/ladder/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-teal-500 hover:text-white  mr-4">
                Attack
                            </Link>
            <Link href="/combatlog/" class="inline-block mt-4 lg:inline-block lg:mt-0 text-red-500 hover:text-white  mr-4">
                Combat log
                            </Link>
            <Link href="/spyinglog/" class="block mt-4 lg:inline-block lg:mt-0 text-blue-500 hover:text-white  mr-4">
                Spying log
                            </Link>
            <Link href="/statistics/" class="block mt-4 lg:inline-block lg:mt-0 text-teal-500 hover:text-white  mr-4">
                Game statistics
                            </Link>

        </Fragment>)
    }


    async logout() {
        let response = await Axios.get('/api/account/logout');

        // Wait for a response to invalidate sessions
        this.props.logout();
        this.props.clearProfile()
    }
}


export default connect(['account', 'profile'], actions)(Navbar)