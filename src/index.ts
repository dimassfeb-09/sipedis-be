import Inert from "@hapi/inert";
import path from "path";
import Hapi from "@hapi/hapi";
import { authRoutes } from "./routes/auth_routes";
import { verifyToken } from "./middleware/auth";
import { chatRoutes } from "./routes/chat_routes";

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"], // Mengizinkan semua origin
        additionalHeaders: [
          "cache-control",
          "x-requested-with",
          "authorization",
        ],
      },
    },
  });

  await server.register(Inert);

  // Register routes
  server.route([
    ...authRoutes,
    ...chatRoutes,
    {
      method: "GET",
      path: "/",
      handler: () => ({ message: "Hello from Hapi.js + PostgreSQL!" }),
    },
  ]);

  server.route({
    method: "GET",
    path: "/images/{param*}",
    handler: {
      directory: {
        path: path.join(__dirname, "uploads"),
        listing: false,
        index: false,
      },
    },
  });

  server.route({
    method: "GET",
    path: "/protected-data",
    options: {
      pre: [{ method: verifyToken }],
    },
    handler: (request, h) => {
      const user = request.plugins.authUser;
      return { message: "Welcome to protected data", data: user };
    },
  });

  await server.start();
  console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

init();
