import { Component, h } from 'preact';
import { Link } from 'preact-router';

/**
 * Renders html in html prop
 */
export default class Navbar extends Component {
    constructor(props) {
        super(props)
        this.state = {
            open: false
        }

    }
    render() {
        return (
            <div className='page' >
                <div className='sidePanelPage'>
                    <div className='sidePanel'>

                    </div>

                    <div className='mainPanel'>
                        {this.props.children}
                    </div></div>
            </div >
        )
    }
}