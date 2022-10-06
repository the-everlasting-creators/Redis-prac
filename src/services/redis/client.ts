import { createClient, defineScript } from 'redis';
import { itemsKey, itemsByViewsKey, itemsViewsKey } from '$services/keys';
import { createIndexes } from './create-indexes';

const client = createClient({
	socket: {
		host: process.env.REDIS_HOST,
		port: parseInt(process.env.REDIS_PORT)
	},
	password: process.env.REDIS_PW,
	scripts: {
		unlock: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT: `
				if redis.call('GET', KEYS[1]) == ARGV[1] then
					return redis.call('DEL', KEYS[1])
				end
			`,
			transformArguments(key: string, token: string) {
				return [key, token];
			},
			transformReply(reply: any) {
				return reply;
			}
		}),
		addOneAndStore: defineScript({
			NUMBER_OF_KEYS: 1,
			SCRIPT: `
				local keyToAssignIncrementedNumberTo = KEYS[1]

				return redis.call('SET', keyToAssignIncrementedNumberTo, 1 + tonumber(ARGV[1]))
			`,
			transformArguments(key: string, value: number) {
				return [key, value.toString()];
			},
			transformReply(reply: any, preserved?) {
				return reply;
			}
		}),
		incrementView: defineScript({
			NUMBER_OF_KEYS: 3,
			SCRIPT: `
				local itemsViewsKey = KEYS[1]
				local itemsKey = KEYS[2]
				local itemsByViewKey = KEYS[3]
				local itemId = ARGV[1]
				local userId = ARGV[2]

				local inserted = redis.call('PFADD', itemsViewsKey, userId)

				if inserted == 1 then
					redis.call('HINCRBY', itemsKey, 'views', 1)
					redis.call('ZINCRBY', itemsByViewKey, 1, itemId)
				end
			`,
			transformArguments(itemId: string, userId: string) {
				return [itemsViewsKey(itemId), itemsKey(itemId), itemsByViewsKey(), itemId, userId];
				// EVALSHA ID 3
			},
			transformReply() {}
		})
	}
});

// Test
// client.on('connect', async () => {
// 	await client.addOneAndStore('books:count', 5);
// 	const result = await client.get('books:count');
// 	console.log(`result:`, result);
// });

client.on('error', (err) => console.error(err));
client.connect();

client.on('connect', async () => {
	try {
		await createIndexes();
	} catch (error) {
		console.error(error);
	}
});

export { client };
