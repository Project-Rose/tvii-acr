import { Application, Router } from "@oak/oak";
import config from "./config/config.json" with { type: "json" };
import { bold, brightBlue } from "@std/fmt/colors"
const port = config.http.port
const app = new Application();
const router = new Router();

router.all("/connect/:hostname/:port", async (context) => {
  const { hostname, port } = context.params;

  if (context.request.method === "CONNECT") {
    try {
      const conn = await Deno.connect({ hostname, port: Number(port) });
      const clientConn = context.request.conn;
      
      const clientReader = clientConn.readable.getReader();
      const clientWriter = clientConn.writable.getWriter();

      context.response.status = 200;
      context.response.body = "Connection Established";

      await Promise.all([
        clientReader.read().then(({ value }) => conn.write(value)),
        conn.readable.getReader().read().then(({ value }) => clientWriter.write(value)),
      ]);

      clientConn.close();
      conn.close();
    } catch (err) {
      console.error(`Failed to connect to ${hostname}:${port}`, err);
      context.response.status = 502;
      context.response.body = "Bad Gateway";
    }
  } else {
    context.response.status = 405;
    context.response.body = "Unsupported method";
  }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ hostname: "0.0.0.0", port: port });
console.log(bold(brightBlue(`TVii-ACR is running on port ${port}`)));
