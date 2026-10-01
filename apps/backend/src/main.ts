import "dotenv/config";
import { buildApp } from "./app.js";
import { attachRealtime } from "./realtime.js";
import { startVpnServer } from "./vpnServer.js";

const port = Number(process.env.PORT ?? 3000);
const vpnPort = Number(process.env.VPN_PORT ?? 8443);
const host = "0.0.0.0";
const app = buildApp();

await app.listen({ port, host });
attachRealtime(app.server);
startVpnServer(vpnPort, host);

app.log.info(`DroidView backend listening on http://${host}:${port}`);
app.log.info(`DroidView Multi-Protocol VPN Tunnel listening on port ${vpnPort} (TCP/UDP/TLS)`);
