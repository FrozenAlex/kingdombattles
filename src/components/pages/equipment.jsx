import { Component, h } from "preact";

import Axios from "axios";
//panels
import EquipmentPanel from "../panels/equipment.jsx";
import { connect } from "unistore/preact";
import { route } from "preact-router";
import MainLayout from "../layouts/MainLayout.jsx";

class Equipment extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fetch: null,
      warning: ""
    };
  }

  componentDidMount() {
    if (!this.props.account) {
      route("/login/", true);
    }
    this.getProfile(this.props.username);
  }

  componentWillUnmount() {
  }

  render() {
    let warningStyle = {
      display: this.state.warning.length > 0 ? "flex" : "none"
    };

    return (
      <MainLayout>
        <div className="warning" style={warningStyle}>
          <p>{this.state.warning}</p>
        </div>

        <h1 className="centered">Equipment</h1>
        <p className="centered">
          Your Scientists: {this.props.profile.scientists} / Your Gold:{" "}
          {this.props.profile.gold}
        </p>

        <EquipmentPanel
          setWarning={this.setWarning.bind(this)}
          scientists={this.props.scientists}
          gold={this.props.gold}
          onSuccess={() => this.getProfile(this.props.username)}
        />
      </MainLayout>
    );
  }

  setWarning(s) {
    this.setState({ warning: s });
  }

  //gameplay functions
  async getProfile(url, username = "") {
    //send a unified request, using my credentials
    // use Axios
    let response = await Axios.get(`/api/game/profile/${username}`);

    //on success
    // TODO: Implement storing scientists to store
    // this.props.storeScientists(response.data.scientists);
    // this.props.storeGold(response.data.gold);
  }
}

export default connect(["account", "profile"])(Equipment);
