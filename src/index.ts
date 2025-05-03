// src/server.ts
import Hapi from "@hapi/hapi";
import { authRoutes } from "./routes/auth_routes";
import { verifyToken } from "./middleware/auth";

const init = async () => {
  const server = Hapi.server({
    port: 8080,
    host: "localhost",
  });

  // Register routes
  server.route([
    ...authRoutes,
    {
      method: "GET",
      path: "/",
      handler: () => ({ message: "Hello from Hapi.js + PostgreSQL!" }),
    },
  ]);

  server.route({
    method: "GET",
    path: "/protected-data",
    options: {
      pre: [{ method: verifyToken }], // Memasukkan middleware untuk memverifikasi JWT
    },
    handler: (request, h) => {
      // Mengakses data yang disimpan di request.plugins.authUser oleh middleware
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
