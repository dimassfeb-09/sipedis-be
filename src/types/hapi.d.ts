import "@hapi/hapi";

declare module "@hapi/hapi" {
  interface PluginsStates {
    authUser?: {
      id: string;
      email: string;
      name: string;
    };
  }
}
