export function prettyPrintKeyValue(
  key: string,
  value?: string,
  padding = 30,
): void {
  if (!value || value.includes('undefined')) return;

  const paddedLabel = `${key}:`.padEnd(padding, ' ');
  console.log(`${paddedLabel}${value}`);
}
