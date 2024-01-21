import fastify, {FastifyInstance} from "fastify";
import cors from "@fastify/cors";
import {fastifyAwilixPlugin} from "@fastify/awilix";
import latencyLogs from "./middlewares/latencyLogs";
import fastifyEnvPlugin from "./config";

declare module "fastify" {
	interface FastifyInstance {
		config: {
			PORT: number;
			NODE_ENV: string;
		};
	}

	interface FastifyRequest {
		auth: {
			_id: string;
			expiredOn: number;
			issuedOn: number;
			email: string;
			token: string;
		};
	}
}

const healthCheckIntervalMS: number = 60000;

class FastifyServer {
	server: FastifyInstance;
	healthCheckInterval: NodeJS.Timeout;

	constructor() {
		this.server = fastify({
			logger: true,
		});
		this.registerEnv();

		this.registerDi();

		this.registerCors();

		this.registerRoutes();

		this.registerBackendHealthCheck();
	}

	registerBackendHealthCheck() {
		this.healthCheckInterval = setInterval(() => {
			this.server.log.info("Backend is up");
		}, healthCheckIntervalMS);
	}

	registerDi() {
		this.server.register(fastifyAwilixPlugin, {
			disposeOnClose: false,
			disposeOnResponse: false,
			asyncInit: true,
			asyncDispose: true,
		});

		this.server.log.info("Di registered");
	}

	registerRoutes() {
        // add api routes here
		this.server.register(latencyLogs).after(() => {
		});
	}
	registerEnv() {

		this.server.register(fastifyEnvPlugin).ready(async (err) => {
			if (err) {
				this.server.log.error(err);
				process.exit(1);
			}
			this.server.log.info("Environment variables loaded");
			await this.start();

			// initialized after loading env variables
			// this.registerSynchronizationService();
		});
	}

	registerCors() {
		this.server.register(cors, {
			origin: "*",
			methods: ["GET", "PUT", "POST", "DELETE", "PATCH", "OPTIONS"],
			credentials: true,
			allowedHeaders: [
				"X-CSRF-Token",
				"X-Requested-With",
				"Accept",
				"Accept-Version",
				"Content-Length",
				"Content-MD5",
				"Content-Type",
				"Date",
				"X-Api-Version",
				"Authorization",
				"Anonymous",
			],
		});
		this.server.log.info("Cors registered");
	}

	async start() {
		try {
			await this.server.listen({port: this.server.config.PORT, host: "0.0.0.0"}, (err, address) => {
                if (err) {
                  throw err
                }
            });
			await this.server.ready();

			this.server.log.info("Server is ready");

			const exitHandler = () => {
				process.exit();
			};

			process.on("SIGINT", exitHandler);
			process.on("SIGTERM", exitHandler);
			process.on("SIGQUIT", exitHandler);
		} catch (err) {
			this.server.log.error(err);
			process.exit(1);
		}
	}
}

export const fastifyServer = new FastifyServer();

