import "dotenv/config";
import { createServer } from "node:http";
import app from "./app.js";
import { initSocket } from "./common/config/socket.io.js";
import connectDB from "./common/config/db.js";



const PORT = process.env.PORT ?? 8080;

async function main() {
  await connectDB();

  const server = createServer(app);

  // Initialize the socket server
  initSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
  });
}

main();
