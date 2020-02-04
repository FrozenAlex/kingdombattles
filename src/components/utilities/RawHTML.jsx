import {Component, h} from 'preact';

/**
 * Renders html in html prop
 */
export default class RawHTML extends Component {
    constructor(props) {
        super(props)
    }
    render(){
        return (
            <div dangerouslySetInnerHTML={{__html:this.props.html}}></div>
        )
    }
}
