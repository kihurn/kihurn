import { createServer } from "node:http";

const PORT = Number(process.env.MOCK_PORT ?? 7081);
let down = process.env.MOCK_DOWN === "1";

createServer((req, res) => {
  const send = (code: number, body: unknown) => {
    res.writeHead(code, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };
  if (req.url === "/__down") { down = true; return send(200, { down }); }
  if (req.url === "/__up") { down = false; return send(200, { down }); }
  if (down) return send(503, { error: "down" });
  if (req.url === "/api/tags" && req.method === "GET") return send(200, { models: [] });
  if (req.url === "/api/chat" && req.method === "POST") {
    if (req.headers.authorization !== "Bearer mock-key") return send(401, { error: "unauthorized" });
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      try {
        const msgs = JSON.parse(raw).messages as { role: string; content: string }[];
        const last = [...msgs].reverse().find((m) => m.role === "user")?.content ?? "";
        send(200, { message: { role: "assistant", content: `(mock) You asked: ${last}` } });
      } catch {
        send(400, { error: "bad json" });
      }
    });
    return;
  }
  send(404, { error: "not found" });
}).listen(PORT, "127.0.0.1", () => console.log(`c0re mock on :${PORT}${down ? " (DOWN)" : ""}`));
