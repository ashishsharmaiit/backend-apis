import {FastifyInstance} from "fastify";
const fastifyEnv = require("@fastify/env");
const fastifyPlugin = require("fastify-plugin");

async function fastifyEnvPlugin(fastify: FastifyInstance) {
	fastify.register(fastifyEnv, {
		schema: {
			type: "object",
			required: [
				"NODE_ENV",
			],
			properties: {
				NODE_ENV: {
					type: "string",
				}
			},
		},
		dotenv: {
			path: `.env`,
		},
		env: true,
		confKey: "config",
	});
}

export default fastifyPlugin(fastifyEnvPlugin);
