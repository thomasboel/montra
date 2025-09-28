/**
 * This library was developed by Gemini 2.5 Pro
 */
import chalk from 'chalk';

/**
 * A union type of all valid foreground color names from the 'chalk' library.
 */
export type ChalkColor =
  | 'black'
  | 'red'
  | 'green'
  | 'yellow'
  | 'blue'
  | 'magenta'
  | 'cyan'
  | 'white'
  | 'gray'
  | 'grey'
  | 'blackBright'
  | 'redBright'
  | 'greenBright'
  | 'yellowBright'
  | 'blueBright'
  | 'magentaBright'
  | 'cyanBright'
  | 'whiteBright';

/**
 * @interface BoxOptions
 * Defines the settings for creating a CLI box.
 */
interface BoxOptions {
  /** The main content of the box. Can include newline characters (\n). */
  text: string;

  /** An optional title to display in the box's border. */
  title?: string;

  /** Position of the title in the border. Defaults to 'topLeft'. */
  titlePosition?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight';

  /** Alignment of the text within the box. Defaults to 'standard' (left-aligned). */
  textStyle?: 'standard' | 'centered';

  /** Total width of the box in characters. Defaults to 80. */
  width?: number;

  /** Internal padding between the text and the vertical borders. Defaults to 1. */
  padding?: number;

  /** Color for the box border. Uses chalk color names (e.g., 'red', 'green', 'blue'). */
  borderColor?: ChalkColor;

  /** Color for the title text. Defaults to the borderColor if not provided. */
  titleColor?: ChalkColor;

  /** Color for the main text content. */
  textColor?: ChalkColor;
}

/**
 * Default options for the box.
 */
const defaultOptions: Required<
  Omit<
    BoxOptions,
    'text' | 'title' | 'borderColor' | 'titleColor' | 'textColor'
  >
> = {
  titlePosition: 'topLeft',
  textStyle: 'standard',
  width: 80,
  padding: 1,
};

/**
 * Box drawing characters.
 */
const BOX_CHARS = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
};

/**
 * Wraps a string into an array of lines of a given maximum length.
 * @param text - The text to wrap.
 * @param maxWidth - The maximum width for each line.
 * @returns An array of strings, where each string is a line.
 */
function wordWrap(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  // Split text into lines based on user-provided newlines
  const initialLines = text.split('\n');

  for (const initialLine of initialLines) {
    if (initialLine.length <= maxWidth) {
      lines.push(initialLine);
      continue;
    }

    let currentLine = '';
    const words = initialLine.split(' ');
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > maxWidth) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

/**
 * Creates a horizontal border line for the box.
 * @param width - The total width of the border.
 * @param title - The optional title text.
 * @param position - The position of the title.
 * @param borderColor - The color of the border characters.
 * @param titleColor - The color of the title text.
 * @returns The formatted border string.
 */
function createHorizontalBorder(
  width: number,
  title?: string,
  position?:
    | 'topLeft'
    | 'topCenter'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomCenter'
    | 'bottomRight',
  borderColor?: string,
  titleColor?: string,
): string {
  const innerWidth = width - 2;
  const applyBorderColor = (s: string) =>
    // @ts-ignore
    borderColor && chalk[borderColor] ? chalk[borderColor](s) : s;
  const applyTitleColor = (s: string) =>
    // @ts-ignore
    titleColor && chalk[titleColor] ? chalk[titleColor](s) : s;

  if (!title) {
    return applyBorderColor(BOX_CHARS.horizontal.repeat(innerWidth));
  }

  const titleText = ` ${title} `;
  const titleLength = titleText.length;

  if (titleLength >= innerWidth) {
    // Truncate title if it's too long
    return applyTitleColor(titleText.substring(0, innerWidth));
  }

  const coloredTitle = applyTitleColor(titleText);
  const remainingWidth = innerWidth - titleLength;

  switch (position) {
    case 'topCenter':
    case 'bottomCenter':
      const left = Math.floor(remainingWidth / 2);
      const right = Math.ceil(remainingWidth / 2);
      return `${applyBorderColor(BOX_CHARS.horizontal.repeat(left))}${coloredTitle}${applyBorderColor(BOX_CHARS.horizontal.repeat(right))}`;

    case 'topRight':
    case 'bottomRight':
      return `${applyBorderColor(BOX_CHARS.horizontal.repeat(remainingWidth))}${coloredTitle}`;

    case 'topLeft':
    case 'bottomLeft':
    default:
      return `${coloredTitle}${applyBorderColor(BOX_CHARS.horizontal.repeat(remainingWidth))}`;
  }
}

/**
 * Creates the content lines of the box.
 * @param wrappedLines - The pre-wrapped lines of text.
 * @param contentWidth - The width available for content.
 * @param padding - The horizontal padding.
 * @param textStyle - The alignment style for the text.
 * @param textColor - The color of the content text.
 * @param borderColor - The color of the vertical borders.
 * @returns An array of formatted content line strings.
 */
function createContentLines(
  wrappedLines: string[],
  contentWidth: number,
  padding: number,
  textStyle: 'standard' | 'centered',
  textColor?: string,
  borderColor?: string,
): string[] {
  const paddingStr = ' '.repeat(padding);
  const applyBorderColor = (s: string) =>
    // @ts-ignore
    borderColor && chalk[borderColor] ? chalk[borderColor](s) : s;
  const applyTextColor = (s: string) =>
    // @ts-ignore
    textColor && chalk[textColor] ? chalk[textColor](s) : s;
  const verticalBorder = applyBorderColor(BOX_CHARS.vertical);

  return wrappedLines.map((line) => {
    let content: string;
    const remainingSpace = contentWidth - line.length;

    if (textStyle === 'centered') {
      const leftSpace = Math.floor(remainingSpace / 2);
      const rightSpace = Math.ceil(remainingSpace / 2);
      content = `${' '.repeat(leftSpace)}${applyTextColor(line)}${' '.repeat(rightSpace)}`;
    } else {
      // standard
      content = `${applyTextColor(line)}${' '.repeat(remainingSpace)}`;
    }

    return `${verticalBorder}${paddingStr}${content}${paddingStr}${verticalBorder}`;
  });
}

/**
 * Creates a string representation of a styled box for CLI output.
 * @param options - The configuration for the box.
 * @returns A string containing the fully formatted box.
 */
function createBox(options: BoxOptions): string {
  const settings = { ...defaultOptions, ...options };
  const {
    width,
    padding,
    title,
    titlePosition,
    text,
    textStyle,
    borderColor,
    titleColor,
    textColor,
  } = settings;

  const contentWidth = width - padding * 2 - 2; // -2 for vertical borders
  if (contentWidth <= 0) {
    throw new Error('Box width is too small for the given padding.');
  }

  const wrappedText = wordWrap(text, contentWidth);

  const isTopTitle = titlePosition.startsWith('top');
  const topBorderTitle = isTopTitle ? title : undefined;
  const bottomBorderTitle = !isTopTitle ? title : undefined;

  const applyBorderColor = (s: string) =>
    // @ts-ignore
    borderColor && chalk[borderColor] ? chalk[borderColor](s) : s;
  const effectiveTitleColor = titleColor || borderColor;

  const topBorder = `${applyBorderColor(BOX_CHARS.topLeft)}${createHorizontalBorder(width, topBorderTitle, titlePosition, borderColor, effectiveTitleColor)}${applyBorderColor(BOX_CHARS.topRight)}`;
  const bottomBorder = `${applyBorderColor(BOX_CHARS.bottomLeft)}${createHorizontalBorder(width, bottomBorderTitle, titlePosition, borderColor, effectiveTitleColor)}${applyBorderColor(BOX_CHARS.bottomRight)}`;

  const contentLines = createContentLines(
    wrappedText,
    contentWidth,
    padding,
    textStyle,
    textColor,
    borderColor,
  );

  // Add empty lines for padding if there's no text
  if (
    wrappedText.length === 0 ||
    (wrappedText.length === 1 && !wrappedText[0])
  ) {
    const emptyLineContent = ' '.repeat(contentWidth);
    const verticalBorder = applyBorderColor(BOX_CHARS.vertical);
    const emptyLine = `${verticalBorder}${' '.repeat(padding)}${emptyLineContent}${' '.repeat(padding)}${verticalBorder}`;
    contentLines.push(emptyLine);
  }

  return [topBorder, ...contentLines, bottomBorder].join('\n');
}

/**
 * Creates and prints a styled box directly to the console.
 * @param options - The configuration for the box.
 */
export function printBox(options: BoxOptions): void {
  console.log(createBox(options));
}

/**
 * @interface PrintBoxesOptions
 * Defines the settings for printing multiple boxes side-by-side.
 */
interface PrintBoxesOptions {
  /** The boxes to be printed. An array of BoxOptions. */
  boxes: BoxOptions[];
  /** The number of spaces to put between each box. Defaults to 2. */
  distanceBetween?: number;
}

/**
 * Creates a string representation of multiple styled boxes rendered side-by-side.
 * @param options - The configuration for the boxes.
 * @returns A string containing the fully formatted boxes.
 */
function createBoxes(options: PrintBoxesOptions): string {
  const { boxes, distanceBetween = 2 } = options;
  if (!boxes || boxes.length === 0) {
    return '';
  }

  const separator = ' '.repeat(distanceBetween);

  // 1. Generate each box as an array of lines
  const allBoxLines = boxes.map((boxOpts) => createBox(boxOpts).split('\n'));

  // 2. Find the maximum height (number of lines) among all boxes
  const maxHeight = Math.max(...allBoxLines.map((lines) => lines.length));

  // 3. Normalize box heights by padding shorter boxes
  const paddedBoxLines = allBoxLines.map((lines, i) => {
    const boxWidth = boxes[i].width || defaultOptions.width;
    const paddingLine = ' '.repeat(boxWidth);
    while (lines.length < maxHeight) {
      lines.push(paddingLine);
    }
    return lines;
  });

  // 4. Construct the final output line by line
  const finalLines: string[] = [];
  for (let i = 0; i < maxHeight; i++) {
    const lineSegments = paddedBoxLines.map((lines) => lines[i]);
    finalLines.push(lineSegments.join(separator));
  }

  return finalLines.join('\n');
}

/**
 * Creates and prints multiple styled boxes side-by-side to the console.
 * @param options - The configuration for the boxes.
 */
export function printBoxes(options: PrintBoxesOptions): void {
  console.log(createBoxes(options));
}

/* --- Example Usage ---
printBox({
  title: 'Default Box',
  text: 'This is a simple box with a title in the top left corner.',
});

printBox({
  title: 'Colors! 🎨',
  titlePosition: 'topCenter',
  text: 'This box is now colorful! Using the `chalk` library, you can set colors for the border, title, and text.\n' +
    'Isn\'t this ✨ amazing ✨?',
  width: 60,
  borderColor: 'blue',
  titleColor: 'yellow',
  textColor: 'cyan',
  textStyle: 'centered',
});

printBox({
  title: 'Centered Text',
  titlePosition: 'topRight',
  text: 'This text is centered within the box! 🚀\nPerfect for short, impactful statements.',
  textStyle: 'centered',
  borderColor: 'magenta',
});

printBox({
  title: 'A Warning ⚠️',
  titlePosition: 'bottomCenter',
  text: 'This example shows how the library handles long text that needs to be wrapped across multiple lines. The function automatically breaks the words to fit within the specified width, ensuring the layout remains clean and readable.',
  padding: 2,
  borderColor: 'yellow',
  textColor: 'white',
});

printBox({
  title: 'Success ✅',
  titlePosition: 'bottomRight',
  text: 'Operation completed successfully.',
  width: 50,
  textStyle: 'centered',
  borderColor: 'green'
});

printBox({
  text: 'A box with no title, just clean red borders.',
  width: 50,
  borderColor: 'red'
});

console.log('\n\n--- Side-by-Side Box Examples ---');

printBoxes({
  distanceBetween: 4,
  boxes: [
    {
      title: 'Box 1 📦',
      text: 'This is the first box.',
      borderColor: 'cyan',
      width: 30,
      textStyle: 'centered'
    },
    {
      title: 'Box 2 📦',
      text: 'This is the second box.\nIt has more lines than the first one.',
      borderColor: 'magenta',
      width: 35,
    },
    {
      title: 'Box 3 📦',
      text: 'The third box!',
      borderColor: 'yellow',
      width: 25,
      textStyle: 'centered'
    }
  ]
});

printBoxes({
  distanceBetween: 2,
  boxes: [
    {
      title: 'User Info 👤',
      text: 'Name: Alex\nRole: Developer\nStatus: Online',
      borderColor: 'green',
      width: 40
    },
    {
      title: 'System Status ⚙️',
      text: 'CPU: 45%\nMemory: 60%\nDisk: 82%',
      borderColor: 'blue',
      textColor: 'yellow',
      width: 40
    }
  ]
});
*/
