import { Component, h, createContext, Fragment } from "preact";
import { Link } from "preact-router";
import { connect } from "unistore/preact";

/**
 * Main Layout is for laying out pages
 */

let context = createContext({ warning: "" });

class MainLayout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			warning: "" // Global warming is real
		};
	}
	render() {

		return (
			<div className="mt-20">
				<div
					class={`${(this.state.warning)?"" : "hidden"} bg-red-500 p-5`}
				>
					
				</div>
				<div className="flex flex-row">
					<div className="p-1">
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/profile">Kingdom</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/equipment">Stuff</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/badges/">Badges</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/combatlog/">CLog</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/spyinglog/">SLog</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/ladder">Attack</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/statistics/">Stats</Link></div>
						<div className="box w-12 border-gray-200 border-separate h-12"><Link href="/tasklist/">DEV</Link></div>
					</div>
					<context.Provider value={this.state.warning}>
						<div className="flex-grow p-4">{this.props.children}</div>
					</context.Provider>
				</div>
			</div>
		);
	}
}



export default connect('account')(MainLayout);