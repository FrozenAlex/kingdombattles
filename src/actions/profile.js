export const storeProfile = (store, username, gold, recruits, soldiers, spies, scientists, activeBadge) => {
	return {
		profile: {
			username: username,
			gold: gold,
			recruits: recruits,
			soldiers: soldiers,
			spies: spies,
			scientists: scientists,
			activeBadge: activeBadge
		}

	};
}

export const clearProfile = () => {
	return {
		profile:null
	};
}