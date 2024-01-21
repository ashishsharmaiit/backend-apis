import {
	FastifyInstance,
	FastifyRequest,
	FastifyReply,
	FastifyPluginCallback,
} from "fastify";
import fastifyPlugin from "fastify-plugin";

const latencyLogs: FastifyPluginCallback = (
	fastify: FastifyInstance,
	opts: any,
	done: () => void,
) => {
	fastify.addHook(
		"preHandler",
		(request: FastifyRequest, reply: FastifyReply, done) => {
			(request as any)["startTime"] = process.hrtime();
			done();
		},
	);

	fastify.addHook(
		"onResponse",
		(request: FastifyRequest, reply: FastifyReply, done) => {
			const endTime = process.hrtime((request as any)["startTime"]);
			const latency = (endTime[0] * 1e9 + endTime[1]) / 1e6; // Convert to milliseconds
			fastify.log.info(
				`Latency for ${request.url}: ${latency.toFixed(2)} ms`,
			);
		},
	);

	done();
};

export default fastifyPlugin(latencyLogs);
