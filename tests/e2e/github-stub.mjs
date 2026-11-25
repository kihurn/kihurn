import { createServer } from "node:http";

createServer((_req, res) => {
  res.writeHead(500, { "content-type": "application/json" });
  res.end('{"message":"stub: server error"}');
}).listen(3201, () => console.log("github stub on 3201 (always 500)"));
