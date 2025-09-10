import { useEffect, useRef } from "react";
import { Compartment, EditorState } from "@codemirror/state";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { javascript } from "@codemirror/lang-javascript";

/**
 * A React component that wraps the CodeMirror 6 editor.
 * It handles initialization, content updates, and language mode changes.
 * @param {object} props
 * @param {string} props.code - The code content to display in the editor.
 * @param {function} props.onChange - A callback function that is called with the new code when the editor content changes.
 * @param {string} props.filePath - The path of the file being edited, used to determine the language for syntax highlighting.
 */
export default function CodeEditor({ code, onChange, filePath }) {
  // A React ref to hold the DOM element where CodeMirror will be mounted.
  const editorContainerRef = useRef(null);
  // A React ref to hold the CodeMirror EditorView instance. This allows us to interact
  // with the editor instance across different renders and effects.
  const editorViewRef = useRef(null);
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
        // A basic theme to style the editor.
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
            fontFamily: "monospace",
            backgroundColor: "white"
          },
          ".cm-content": {
            padding: "1rem"
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


  // This is the target DOM element for CodeMirror. The `ref` connects it to our `editorContainerRef`.
  return <div ref={editorContainerRef} className="codemirror-wrapper" style={{ height: '100%' }} />;
}