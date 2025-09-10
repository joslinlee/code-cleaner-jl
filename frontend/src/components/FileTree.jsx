// FileTree.jsx
import { useState } from "react";

/**
 * A recursive component that renders a single node (a file or a folder) in the file tree.
 * @param {object} props
 * @param {object} props.treeNode - The node object to render.
 * @param {function} props.onFileSelect - The function to call when a file is selected.
 */
function TreeNode({ treeNode, onFileSelect }) {
  // State to manage whether a folder is expanded or collapsed.
  const [expanded, setExpanded] = useState(false); // Default to collapsed

  // Determine if the node is a folder. It's a folder if its type is explicitly 'folder'
  // or if it has a `children` array with items in it.
  const isFolder = treeNode.type === "folder" || (treeNode.children && treeNode.children.length > 0);

  return (
    <div className="tree-node">
      {/* Render a folder or a file based on the node type */}
      {isFolder ? (
        // If it's a folder, make it clickable to toggle the expanded state.
        <div className="folder" onClick={() => setExpanded(!expanded)} role="button" tabIndex={0}>
          {/* Show different icons for expanded/collapsed states */}
          {expanded ? "📂" : "📁"} {treeNode.name}
        </div>
      ) : (
        // If it's a file, make it clickable to trigger the onSelect callback.
        <div className="file" onClick={() => onFileSelect(treeNode.path)} role="button" tabIndex={0}>
          📄 {treeNode.name}
        </div>
      )}
      {/* If the node is a folder and it's expanded, render its children */}
      {isFolder && expanded && (
        <div className="children">
          {/* Sort children to show folders before files, then sort alphabetically. */}
          {treeNode.children
            .sort((a, b) => {
              if (a.type === "folder" && b.type !== "folder") return -1;
              if (a.type !== "folder" && b.type === "folder") return 1;
              return a.name.localeCompare(b.name);
            })
            // Recursively render a TreeNode for each child.
            .map((childNode) => (
              <TreeNode key={childNode.path} treeNode={childNode} onFileSelect={onFileSelect} />
            ))}
        </div>
      )}
    </div>
  );
}

/**
 * The main component that takes a flat array of file objects and renders a hierarchical file tree.
 * @param {object} props
 * @param {Array<object>} props.files - A flat array of file objects, each with a `path`.
 * @param {function} props.onFileSelect - The function to call when a file is selected.
 */
export default function FileTree({ files, onFileSelect }) {
  // Create a virtual root node to serve as the base of the tree structure.
  const root = { type: "folder", name: "root", children: [], path: "" };

  // Iterate over each file from the flat list to build the tree structure.
  files.forEach((fileInfo) => {
    // Ensure file.path exists, as it's the primary key for tree building.
    if (!fileInfo.path) return;

    // Split the path into parts (e.g., 'src/components/Button.jsx' -> ['src', 'components', 'Button.jsx']).
    const pathParts = fileInfo.path.split("/").filter(Boolean); // .filter(Boolean) removes empty strings from leading/trailing slashes.
    let currentNode = root;

    // Walk down the tree for each part of the path.
    pathParts.forEach((pathPart, idx) => {
      // Check if a node for the current part already exists in the current directory.
      let existingNode = currentNode.children.find((childNode) => childNode.name === pathPart);

			// Remove magic number, by processing array length
			const pathPartsArrLength = pathParts.length - 1;

      // If the node doesn't exist, create it.
      if (!existingNode) {
				// If this is the last part, it's a file; otherwise, it's a folder.
        existingNode =
          idx === pathPartsArrLength
            ? { type: fileInfo.type || "file", name: pathPart, path: fileInfo.path, size: fileInfo.size } // Use file.type from server
            : { type: "folder", name: pathPart, children: [], path: [currentNode.path, pathPart].filter(Boolean).join("/") }; // Build path for folders too
        currentNode.children.push(existingNode);
      } else if (idx < pathPartsArrLength && !existingNode.children) {
        // This is an edge case: a file with the same name as a needed directory was processed first.
        // "Upgrade" the existing file node to a folder node by adding a `children` array.
        existingNode.type = "folder";
        existingNode.children = [];
      }
      // Move down to the next level in the tree for the next path part.
      currentNode = existingNode;
    });
  });

  // Render the file tree inside a sidebar.
  return (
    <aside className="sidebar">
      <h2>Files</h2>
      <div className="file-tree">
        {/* Render the direct children of the root node. */}
        {root.children
          .sort((a, b) => {
            // Sort top-level folders before files, then alphabetically.
            if (a.type === "folder" && b.type !== "folder") return -1;
            if (a.type !== "folder" && b.type === "folder") return 1;
            return a.name.localeCompare(b.name);
          })
          // Render a TreeNode for each top-level item.
          .map((topLevelNode) => (
            <TreeNode key={topLevelNode.path} treeNode={topLevelNode} onFileSelect={onFileSelect} />
          ))}
      </div>
    </aside>
  );
}