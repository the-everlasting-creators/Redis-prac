import 'dotenv/config';
import { client } from '../src/services/redis';

const run = async () => {
	await client.hSet('car', {
		color: 'red',
		year: 1950,
		owner: null || '',
		service: undefined || ''
	});
	// await client.hSet('test', ['color', 'red', 'year', '1950', 'owner', '', 'service', '']);

	const car = await client.hGetAll('carfesfs');

	if (Object.keys(car).length === 0) {
		console.log(' Car not found, respond with 404');
	}

	console.log(`keys:`, car);

	const commands = [1, 2, 3].map((id) => {
		return client.hGetAll('car' + id);
	});

	const results = await Promise.all(commands);

	console.log(results);
};
run();
