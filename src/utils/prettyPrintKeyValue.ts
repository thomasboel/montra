export function prettyPrintKeyValue(key: string, value?: string, padding = 30): void {
  if (!value || value.includes('undefined')) return;

  const paddedLabel = `${key}:`.padEnd(padding, ' ');
  console.log(`${paddedLabel}${value}`);
}

export function printBox(text: string) {
  const lines = text.split('\n'); // support multi-line text
  const maxLength = Math.max(...lines.map((line) => line.length));

  const horizontalBorder = '─'.repeat(maxLength + 2);

  console.log('┌' + horizontalBorder + '┐');
  lines.forEach((line) => {
    const padding = ' '.repeat(maxLength - line.length);
    console.log('│ ' + line + padding + ' │');
  });
  console.log('└' + horizontalBorder + '┘');
}

export function padLabel(label: string, length: number): string {
  return label.padEnd(length, ' ');
}

function makeBox(text: string) {
  const lines = text.split('\n');
  const maxLength = Math.max(...lines.map((line) => line.length));
  const horizontalBorder = '─'.repeat(maxLength + 2);

  const boxLines = [];

  boxLines.push('┌' + horizontalBorder + '┐');
  lines.forEach((line) => {
    const padding = ' '.repeat(maxLength - line.length);
    boxLines.push('│ ' + line + padding + ' │');
  });
  boxLines.push('└' + horizontalBorder + '┘');

  return boxLines;
}

export function printBoxesSideBySide(...texts: string[]) {
  const boxes = texts.map(makeBox);

  // find tallest box
  const maxHeight = Math.max(...boxes.map((b) => b.length));

  // pad shorter boxes with empty lines
  const paddedBoxes = boxes.map((box) => {
    const width = box[0].length; // each box's width
    const padded = [...box];
    while (padded.length < maxHeight) {
      padded.splice(padded.length - 1, 0, '│' + ' '.repeat(width - 2) + '│');
    }
    return padded;
  });

  // stitch them together line by line
  for (let i = 0; i < maxHeight; i++) {
    console.log(paddedBoxes.map((box) => box[i]).join(' '));
  }
}

export function chunkArray(arr: any[], size: number) {
  if (size <= 0) throw new Error('Size must be greater than 0');

  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
