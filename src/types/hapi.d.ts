import "@hapi/hapi";

declare module "@hapi/hapi" {
  interface PluginsStates {
    authUser?: {
      id: number;
      email: string;
      name: string;
    };
  }
}
