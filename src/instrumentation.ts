export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateProductionEnvironment } = await import("./lib/production-environment");
    try {
      validateProductionEnvironment();
    } catch (error) {
      // Next.js can catch a rejected hook and keep the listener alive. Invalid
      // production configuration must terminate the instance, not just yield 500s.
      console.error((error as Error).message);
      process.exit(1);
    }
  }
}
