import { Component, h, createContext, Fragment } from "preact";

/**
 * Main Layout is for laying out pages
 */

let context = createContext({ warning: "" });

export default class FullscreenLayout extends Component {
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
				{/* <context.Provider value={this.state.warning}> */}
				<div className="p-4">{this.props.children}</div>
				{/* </context.Provider> */}
			</div>
		);
	}
}
