export const LOGIN = 'LOGIN';
export const LOGOUT = 'LOGOUT';
export const SESSION_CHANGE = 'SESSION_CHANGE';

export const login = (prevStore, id, email, username) => {
	return {
		account: {
			id: id,
			email,username
		}
	}
}

export const logout = () => {
	return {
		account: null
	};
}
