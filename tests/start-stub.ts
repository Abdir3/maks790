// Standalone browser harness: no server RPC, credentials, or external requests.
export function useServerFn<T>(fn: T) {
  return fn;
}
export function createServerFn() {
  return {
    inputValidator: (_validator: unknown) => ({
      handler: (_handler: unknown) => async (_args: unknown) => {
        await new Promise((resolve) => setTimeout(resolve, 600));
        return { text: "Simulert diktering til opprinnelig oppgave." };
      },
    }),
  };
}
