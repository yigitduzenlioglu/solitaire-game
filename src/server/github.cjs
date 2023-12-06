"use strict";

async function getGitHubUserData(access_token) {
	return await fetch(
		'https://api.github.com/user', 
		{
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'accept': 'application/json',
			}
		}
	);
}

module.exports = {
	getGitHubUserData: getGitHubUserData,
};
  