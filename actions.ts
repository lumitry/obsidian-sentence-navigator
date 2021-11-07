import { Editor } from 'obsidian';
import {
  getCursorAndParagraphText,
  forEachSentence,
  setCursorAtStartOfLine,
  setCursorAtEndOfLine,
  getPrevNonEmptyLine,
  getNextNonEmptyLine,
} from './utils';

export const deleteToBoundary = (editor: Editor, boundary: 'start' | 'end') => {
  const { cursorPosition, paragraphText } = getCursorAndParagraphText(editor);
  forEachSentence(paragraphText, (sentence) => {
    if (
      cursorPosition.ch >= sentence.index &&
      cursorPosition.ch <= sentence.index + sentence[0].length
    ) {
      const cursorPositionInSentence = cursorPosition.ch - sentence.index;
      if (boundary === 'start') {
        const cutPortion = sentence[0].substring(0, cursorPositionInSentence);
        const newParagraph = paragraphText.replace(cutPortion, '');
        editor.setLine(cursorPosition.line, newParagraph);
        editor.setCursor({
          line: cursorPosition.line,
          ch: cursorPosition.ch - cutPortion.length,
        });
      } else {
        const cutPortion = sentence[0].substring(cursorPositionInSentence);
        const newParagraph = paragraphText.replace(cutPortion, '');
        editor.setLine(cursorPosition.line, newParagraph);
        editor.setCursor({
          line: cursorPosition.line,
          ch: cursorPosition.ch,
        });
      }
    }
  });
};

export const moveToStartOfCurrentSentence = (editor: Editor) => {
  let { cursorPosition, paragraphText } = getCursorAndParagraphText(editor);

  if (cursorPosition.ch === 0) {
    // if cursor is already at the start of this paragraph, move to the previous paragraph
    setCursorAtEndOfLine(
      editor,
      getPrevNonEmptyLine(editor, cursorPosition.line),
    );
  }
  ({ cursorPosition, paragraphText } = getCursorAndParagraphText(editor));

  forEachSentence(paragraphText, (sentence) => {
    const startOfSentence = sentence.index;

    // handle any spaces behind the cursor
    while (
      cursorPosition.ch > 0 &&
      paragraphText.charAt(cursorPosition.ch - 1) === ' '
    ) {
      editor.setCursor({
        line: cursorPosition.line,
        ch: cursorPosition.ch - 1,
      });
      ({ cursorPosition, paragraphText } = getCursorAndParagraphText(editor));
    }

    if (
      cursorPosition.ch > startOfSentence &&
      startOfSentence + sentence[0].length >= cursorPosition.ch
    ) {
      const newPosition = startOfSentence;
      editor.setCursor({
        line: cursorPosition.line,
        ch: newPosition,
      });
      if (newPosition >= paragraphText.length) {
        setCursorAtStartOfLine(
          editor,
          getPrevNonEmptyLine(editor, cursorPosition.line),
        );
      }
    }
  });
};

export const moveToStartOfNextSentence = (editor: Editor) => {
  const { cursorPosition, paragraphText } = getCursorAndParagraphText(editor);
  if (cursorPosition.ch === paragraphText.length) {
    // if starting from an empty line
    setCursorAtStartOfLine(
      editor,
      getNextNonEmptyLine(editor, cursorPosition.line),
    );
  } else {
    forEachSentence(paragraphText, (sentence) => {
      if (
        cursorPosition.ch >= sentence.index &&
        cursorPosition.ch < sentence.index + sentence[0].length
      ) {
        const newPosition = sentence.index + sentence[0].length + 1; // including space
        editor.setCursor({
          line: cursorPosition.line,
          ch: newPosition,
        });
        if (newPosition >= paragraphText.length) {
          setCursorAtStartOfLine(
            editor,
            getNextNonEmptyLine(editor, cursorPosition.line),
          );
        }
      }
    });
  }
};

export const selectSentence = (editor: Editor) => {
  const { cursorPosition, paragraphText } = getCursorAndParagraphText(editor);
  let found = false;
  forEachSentence(paragraphText, (sentence) => {
    if (!found && cursorPosition.ch <= sentence.index + sentence[0].length) {
      editor.setSelection(
        { line: cursorPosition.line, ch: sentence.index },
        {
          line: cursorPosition.line,
          ch: sentence.index + sentence[0].length + 1, // including space
        },
      );
      found = true;
    }
  });
};
