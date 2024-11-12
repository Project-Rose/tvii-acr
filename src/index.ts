import express, { Request, Response } from "express";
import chalk from "chalk";
import net from "net";
import config from "../config/config.json" with { type:"json" };

const port: number = config.http.port
const app = express();

app.all("/connect/:hostname/:port", async (req: Request, res: Response) => {
    const { hostname, port } = req.params;
    
    if (req.method === "CONNECT") {
        try {
            // Connect to the target server
            const conn = net.connect(Number(port), hostname, () => {
                res.writeHead(200, { "Content-Type": "text/plain" });
                res.write("Connection Established");
                
                // Pipe data between the client and the target server
                req.socket.pipe(conn);
                conn.pipe(req.socket);
            });
            
            // Handle connection errors
            conn.on("error", (err: unknown) => {
                console.error(`Failed to connect to ${hostname}:${port}`, err);
                res.writeHead(502, { "Content-Type": "text/plain" });
                res.end("Bad Gateway");
            });
            
        } catch (err) {
            console.error(`Connection error: ${err}`);
            res.writeHead(502, { "Content-Type": "text/plain" });
            res.end("Bad Gateway");
        };
    } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("Unsupported method");
    };
});

app.listen(port, () => {
    console.log(chalk.bgGreen(`TVii-ACR is running on port ${port}`));
});