import { createServer } from "node:http";
import app from "./app.js";

const PORT = process.env.PORT ?? 8080;

async function main() {
  const server = createServer(app);
  server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
}

main();
