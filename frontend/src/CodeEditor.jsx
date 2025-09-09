import { useEffect, useRef } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap, lineNumbers } from "@codemirror/view";
import { defaultKeymap } from "@codemirror/commands";
import { html } from "@codemirror/lang-html"; // For HTML files
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

  // 1. useEffect for initial CodeMirror setup.
  // This effect runs ONLY ONCE when the component first mounts, because of the empty dependency array [].
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
      doc: code, // Set the initial document content from the 'code' prop.
      extensions: [
        lineNumbers(), // Show line numbers.
        keymap.of(defaultKeymap), // Include standard keybindings (undo, redo, etc.).
        getLanguageExtension(filePath), // Set the initial language based on the filePath prop.
        // This listener detects changes to the editor's document.
        EditorView.updateListener.of((viewUpdate) => {
          // `docChanged` is true if the user typed, pasted, or undid an action.
          if (viewUpdate.docChanged) {
            // Call the `onChange` callback prop with the new content.
            onChange(viewUpdate.state.doc.toString());
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
      parent: editorContainerRef.current, // Attach it to our ref'd div.
    });

    // The returned function is a cleanup function that React runs when the component unmounts.
    return () => {
      editorViewRef.current?.destroy(); // Safely destroy the editor instance to prevent memory leaks.
      editorViewRef.current = null;
    };
  }, []); // The empty array [] means this effect runs only once on mount.

  // 2. useEffect to update the editor's content when the 'code' prop changes.
  // This is crucial for loading a new file's content into the editor after it has been initialized.
  useEffect(() => {
    // Ensure the editor view is ready and that the incoming 'code' is different from what's currently in the editor.
    // This prevents an infinite loop of updates.
    if (editorViewRef.current && code !== editorViewRef.current.state.doc.toString()) {
      // `dispatch` is how we send updates to the editor's state.
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length, // Select the entire document.
          insert: code, // Replace it with the new code.
        },
        // Optionally preserve the user's cursor position/selection, though it's often
        // better to reset it when loading a completely new document.
        // selection: viewRef.current.state.selection,
      });
    }
  }, [code]); // This effect re-runs whenever the 'code' prop changes.

  // 3. useEffect to update editor's language mode when 'filePath' prop changes
  useEffect(() => {
    if (editorViewRef.current && filePath) {
      const newLanguageExtension = getLanguageExtension(filePath);
      // Reconfigure the view with the new language extension.
      // NOTE: `reconfigure` replaces all extensions. For this to work correctly,
      // you must provide the full set of extensions again, not just the language one.
      // A more robust solution uses CodeMirror's `Compartment` feature, but this works.
      editorViewRef.current.dispatch({
        effects: EditorView.reconfigure.of([
          // Re-adding all extensions to ensure they are not lost
          lineNumbers(),
          keymap.of(defaultKeymap),
          newLanguageExtension, // The new language
          EditorView.updateListener.of((viewUpdate) => {
            if (viewUpdate.docChanged) {
              onChange(viewUpdate.state.doc.toString());
            }
          }),
          // The theme also needs to be re-applied.
          EditorView.theme({ "&": { height: "100%", fontSize: "14px", fontFamily: "monospace", backgroundColor: "white" }, ".cm-content": { padding: "1rem" } }),
        ])
      });
    }
  }, [filePath]); // This effect runs whenever the 'filePath' prop changes.


  // This is the target DOM element for CodeMirror. The `ref` connects it to our `editorRef`.
  return <div ref={editorContainerRef} className="codemirror-wrapper" style={{ height: '100%' }} />;
}