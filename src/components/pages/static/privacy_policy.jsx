import { Component, h } from "preact";

//panels
import CommonLinks from "../../panels/common_links.jsx";
import RawHTML from "../../utilities/RawHTML.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";

class PrivacyPolicy extends Component {
	//NOTE: react isn't liking the generic markdown_page.jsx class
	render() {
		return (
			<MainLayout>
				<RawHTML html={require("../../../assets/content/privacy_policy.md")}></RawHTML>
			</MainLayout>
		);
	}
}

export default PrivacyPolicy;
