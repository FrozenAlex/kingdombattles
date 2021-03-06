import { Component, h } from "preact";
import queryString from "query-string";

import PagedLadder from "../panels/paged_ladder.jsx";
import { connect } from "unistore/preact";
import { route } from "preact-router";
import MainLayout from "../layouts/MainLayout.jsx";

class Ladder extends Component {
  constructor(props) {
    super(props);

    let params = queryString.parse(props.url);

    this.state = {
      params: params,
      start: parseInt(params.rank) || 0,
      length: 50,
      fetch: null
    };
  }

  render() {
    let ButtonHeader = this.buttonHeader.bind(this);

    return (
      <MainLayout>
        <h1 className="centered">Game Ladder</h1>
        <ButtonHeader />

        <div className="half break mobile hide" />

        <PagedLadder
          start={this.state.start}
          length={this.state.length}
          highlightedName={this.props.account.username}
          getFetch={this.getFetch.bind(this)}
          onReceived={this.onReceived.bind(this)}
        />
        <ButtonHeader />
      </MainLayout>
    );
  }

  buttonHeader() {
    return (
      <div className="table noCollapse">
        <div className="row">
          <button className="col" onClick={this.decrement.bind(this)}>
            {"< Back"}
          </button>
          <div className="col hide mobile" />
          <div className="col hide mobile" />
          <button className="col" onClick={this.increment.bind(this)}>
            {"Next >"}
          </button>
        </div>
      </div>
    );
  }

  increment() {
    let start = this.state.start + this.state.length;
    console.log(this);
    route(`${this.props.path}?rank=${start}`, true);
  }

  decrement() {
    let start = Math.max(0, this.state.start - this.state.length);

    //don't decrement too far
    if (start === this.state.start) {
      return;
    }

    route(`${this.props.path}?rank=${start}`, true);
  }

  //bound callbacks
  getFetch(fn) {
    this.setState({ fetch: fn });
  }

  onReceived(data) {
    if (data.length === 0) {
      let start = Math.max(0, this.state.start - this.state.length);

      //don't decrement too far
      if (start === this.state.start) {
        return;
      }

      this.props.history.replace(
        `${this.props.location.pathname}?rank=${start}`
      );
    }
  }
}

export default connect("account")(Ladder);
