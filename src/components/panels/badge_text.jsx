import React from 'react';
import Badge from './badge.jsx';

class BadgeText extends React.Component {
	render() {
		if (!this.props.filename) {
			return (
				<p {...this.props}>{this.props.children}</p>
			);
		}

		let centerStyle = {
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center'
		};

		let leftStyle = {
			display: 'flex'
		};

		let style = this.props.centered ? centerStyle : leftStyle;

		return (
			<div className={this.props.className} style={{...style, paddingBottom: '0.5em'}}>
				<Badge name={this.props.name} filename={this.props.filename} size={this.props.size} />
				<p style={{paddingBottom: 0, ...this.props.style}}>{this.props.children}</p>
			</div>
		);
	}
};

export default BadgeText;