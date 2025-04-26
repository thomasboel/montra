export function withErrorHandler(action: (...args: any[]) => any) {
  return async (...args: any[]) => {
    try {
      await action(...args);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`❌ ${err.message}`);
      } else {
        console.error('❌ Unknown error', err);
      }
      process.exit(1);
    }
  };
}
