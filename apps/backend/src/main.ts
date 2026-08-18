import "dotenv/config";
import { buildApp } from "./app.js";
import { attachRealtime } from "./realtime.js";

const port = Number(process.env.PORT ?? 3000);
const host = "0.0.0.0";
const app = buildApp();

await app.listen({ port, host });
attachRealtime(app.server);

app.log.info(`DroidView backend listening on http://${host}:${port}`);
