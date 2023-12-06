export const getGitHubUserData = async () => {
	const token = 'github token here';

	await fetch(
		'https://api.github.com/user', 
		{
			method: 'GET',
			headers: {
				'Authorization': token
			}
		}
	)
	.then((response) => {
		return response.json();
	})
	.catch((err) => {
		return 
	})
	.then((data) => {
		// Do something with data here
	});
}