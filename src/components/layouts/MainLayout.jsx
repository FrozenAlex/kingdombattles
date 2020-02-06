import { Component, h, createContext, Fragment } from "preact";

/**
 * Main Layout is for laying out pages
 */

let context = createContext({ warning: "" });

export default class MainLayout extends Component {
	constructor(props) {
		super(props);
		this.state = {
			open: false,
			warning: "ss" // Global warming is real
		};
	}
	render() {
		return (
			<div className="mt-20">
				<div
					className={`${this.state.warning != "" ? "hidden" : ""} bg-red-500 box p-5 `}
				>
					{this.state.warning}
				</div>
				<div className="flex flex-row">
					<div className="p-1">
						<div className="box w-16 border-gray-200 border-separate h-16">Kingdom</div>
						<div className="box w-16 border-gray-200 border-separate h-16">Attack</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
						<div className="box w-16 border-gray-200 border-separate h-16">LBoard</div>
					</div>
					{/* <context.Provider value={this.state.warning}> */}
						<div className="flex-grow p-4">{this.props.children}</div>
					{/* </context.Provider> */}
				</div>
			</div>
		);
	}
}
