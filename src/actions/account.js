export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const SESSION_CHANGE = 'SESSION_CHANGE';

export const login = (id, email, username) => {
	return {
		type: LOGIN,
		id: id,
		email: email,
		username: username
	};
}

export const logout = () => {
	return {
		type: LOGOUT
	};
}

export const sessionChange = () => {
	return {
		type: SESSION_CHANGE
	};
}