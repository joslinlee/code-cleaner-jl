import { useEffect, useRef } from "react";
import { Compartment, EditorState, StateEffect, StateField } from "@codemirror/state";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { EditorView, keymap, lineNumbers, Decoration } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

const lineHighlightEffect = StateEffect.define();

const lineHighlightField = StateField.define({
  create() { return Decoration.none; },
  update(decorations, tr) {
    decorations = decorations.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(lineHighlightEffect)) {
        decorations = e.value ? Decoration.set([Decoration.line({ class: "cm-highlighted-line" }).range(e.value.from)]) : Decoration.none;
      }
    }
    return decorations;
  },
	// f represents a function that takes a field and returns decorations, so in this instance it is lineHighlightField itself
  provide: f => EditorView.decorations.from(f)
});

/**
 * A React component that wraps the CodeMirror 6 editor.
 * It handles initialization, content updates, and language mode changes.
 * @param {object} props
 * @param {string} props.code - The code content to display in the editor.
 * @param {function} props.onChange - A callback function that is called with the new code when the editor content changes.
 * @param {string} props.filePath - The path of the file being edited, used to determine the language for syntax highlighting.
 * @param {object} props.jumpToLine - An object like { path, line, key } to trigger a jump to a specific line.
 */
export default function CodeEditor({ code, onChange, filePath, jumpToLine }) {
  // A React ref to hold the DOM element where CodeMirror will be mounted.
  const editorContainerRef = useRef(null);
  // A React ref to hold the CodeMirror EditorView instance. This allows us to interact
  // with the editor instance across different renders and effects.
  const editorViewRef = useRef(null);
  const highlightTimeoutRef = useRef(null);
  // A ref to hold a CodeMirror Compartment for dynamically changing the language.
  // This is stored in a ref to ensure it's a single, stable instance.
  const languageCompartmentRef = useRef(new Compartment());

  // This ref will hold the latest `onChange` function. This is a common pattern
  // to avoid re-creating the entire editor when the callback prop changes,
  // which would otherwise be a dependency of the main `useEffect`.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  // Helper function to determine which CodeMirror language extension to use
  // based on the file's extension from its path.
  const getLanguageExtension = (path) => {
    if (!path) return []; // Return no extension if path is not provided
    if (/\.html?$/.test(path)) return html();
    if (/\.css$/.test(path)) return css();
    if (/\.js$/.test(path)) return javascript();
    // Default or fallback for plain text or unknown types.
    // An empty array means no specific language highlighting.
    return [];
  };

  // This effect handles the initial CodeMirror setup and runs only once on mount.
  useEffect(() => {
    // Don't do anything if the target DOM element isn't ready yet.
    if (!editorContainerRef.current) return;

    // If a view instance already exists (e.g., from a previous fast refresh in dev), destroy it first.
    if (editorViewRef.current) {
      editorViewRef.current.destroy();
      editorViewRef.current = null;
    }

    // Create the initial state for the editor.
    const initialEditorState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        lineHighlightField,
        keymap.of(defaultKeymap),
        // The language compartment is initialized with the first file's language.
        languageCompartmentRef.current.of(getLanguageExtension(filePath)),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        // This listener detects changes to the editor's document.
        EditorView.updateListener.of((viewUpdate) => {
          // `docChanged` is true if the user typed, pasted, or undid an action.
          if (viewUpdate.docChanged) {
            // Use the ref to call the latest onChange function, avoiding stale closures.
            onChangeRef.current(viewUpdate.state.doc.toString());
          }
        }),
      ],
    });

    // Create the EditorView, which is the UI part of the editor.
    editorViewRef.current = new EditorView({
      state: initialEditorState,
      parent: editorContainerRef.current,
    });

    // The returned function is a cleanup function that React runs when the component unmounts.
    return () => {
      editorViewRef.current?.destroy(); // Safely destroy the editor instance to prevent memory leaks.
      editorViewRef.current = null;
    };
    // This effect runs only once on mount. The `code` and `filePath` props are used
    // only for the initial setup. Subsequent changes are handled by other effects
    // to avoid re-creating the entire editor.
  }, []);

  // This effect updates the editor's content when the 'code' prop changes.
  useEffect(() => {
    // Ensure the editor view is ready and that the incoming 'code' is different from what's currently in the editor.
    // This prevents an infinite loop of updates.
    if (editorViewRef.current && code !== editorViewRef.current.state.doc.toString()) {
      // `dispatch` is how we send updates to the editor's state.
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: code,
        },
      });
    }
  }, [code]); // This effect re-runs whenever the 'code' prop changes.

  // This effect updates the editor's language mode when the 'filePath' prop changes.
  useEffect(() => {
    // If the editor view and a file path exist, dispatch an effect to update
    // the language compartment with the new language extension.
    if (editorViewRef.current && filePath) {
      editorViewRef.current.dispatch({
        effects: languageCompartmentRef.current.reconfigure(
          getLanguageExtension(filePath)
        ),
      });
    }
  }, [filePath]); // This effect runs whenever the 'filePath' prop changes.

  // This effect handles jumping to a specific line when requested.
  useEffect(() => {
    const view = editorViewRef.current;

    // Check if the view is ready, a jump is requested, and it's for the currently active file.
    if (view && jumpToLine && jumpToLine.path === filePath) {
      // Clear any pending highlight removal from a previous jump
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }

      try {
        // CodeMirror lines are 1-based. Get the line object.
        const line = view.state.doc.line(jumpToLine.line);
        // Dispatch a transaction to scroll to the line and set the cursor.
        view.dispatch({
          effects: [
            EditorView.scrollIntoView(line.from, { y: "center" }),
            lineHighlightEffect.of(line) // Add highlight effect
          ],
          selection: { anchor: line.from },
        });

        // Set a timeout to remove the highlight after a couple of seconds
        highlightTimeoutRef.current = setTimeout(() => {
          if (editorViewRef.current) {
            editorViewRef.current.dispatch({ effects: lineHighlightEffect.of(null) });
          }
        }, 2000);
      } catch (e) {
        // This can happen if the line number is out of bounds (e.g., file was edited).
        // It's safe to ignore, but we can log it for debugging.
        console.error(`[CodeEditor DEBUG] Failed to jump to line ${jumpToLine.line}:`, e);
      }
    } // No else branch: if conditions aren't met, do nothing.
		
    // This effect should run whenever a new jump is requested.
    // The `filePath` dependency ensures we only jump if the correct file is visible.
  }, [jumpToLine, filePath]);

  // This is the target DOM element for CodeMirror. The `ref` connects it to our `editorContainerRef`.
  return <div ref={editorContainerRef} className="codemirror-wrapper" style={{ height: '100%' }} />;
}