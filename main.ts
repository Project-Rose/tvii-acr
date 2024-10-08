import config from "./config.json" with { type: 'json' };

const handler = async (req: Request): Promise<Response | void> => {
  if (req.method === "CONNECT") {
    const [hostname, port] = req.url.split(":");

    try {
      const conn = await Deno.connect({ hostname, port: Number(port) });
      const { conn: clientConn, r: clientReader, w: clientWriter } = req;

      await req.respond({ status: 200, body: "Connection Established" });

      await Promise.all([
        await copy(clientReader, conn),
        await copy(conn, clientWriter),
      ]);

      clientConn.close();
      conn.close();
    } catch (err) {
      console.error(`Failed to connect to ${hostname}:${port}`, err);
      return new Response("Bad Gateway", { status: 502 });
    }
  } else {
    return new Response("Unsupported method", { status: 405 });
  }
};

// Start the server
Deno.serve(
  {
    port: config.port,
    hostname: "0.0.0.0",
  },
  handler
);
