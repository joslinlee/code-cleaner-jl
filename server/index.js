// Import necessary Node.js modules and third-party libraries.
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { fileURLToPath } from "url";
import { execa } from "execa"; // For running shell commands like Gulp
import archiver from "archiver"; // For creating ZIP archives
import { runWebScan } from "../modules/scanRunner.js"; // Custom module for scanning HTML files

// These lines are standard boilerplate for getting the current file's path and directory name in an ES Module context.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize the Express application.
const app = express();

// --- Middleware Setup ---
// Enable Cross-Origin Resource Sharing (CORS) to allow requests from the frontend.
app.use(cors());
// Enable parsing of JSON request bodies, with a high limit to handle potentially large file data.
app.use(express.json({ limit: "50mb" }));
// Enable parsing of URL-encoded request bodies.
app.use(express.urlencoded({ extended: true }));

// Define constant paths for input, output, and report directories.
const INPUT_DIR = path.join(__dirname, "..", "_input");
const OUTPUT_DIR = path.join(__dirname, "..", "_output");
const REPORTS_DIR = path.join(__dirname, "..", "_reports");

/** ---------- Upload (folder or files) ---------- */
// Configure multer to use memory storage. This is crucial because it allows us to receive
// the file buffers in memory without writing them to a temporary disk location first.
// This approach gives us full control over where and how files are saved based on the paths sent from the frontend.
const upload = multer({ storage: multer.memoryStorage() });


// --- API Endpoints ---

// Serves individual files from the `_input` directory based on a relative path provided in the query string and sets appropriate content types for previewing text files in the browser.
app.get("/api/file", async (req, res) => {
  const relativePath = req.query.path || "";
  const fullPath = path.join(INPUT_DIR, relativePath);
  // Security check: ensure the path is within INPUT_DIR
  if (!fullPath.startsWith(INPUT_DIR)) return res.status(400).send("bad path");
  if (!(await fs.pathExists(fullPath))) return res.status(404).end();
  // Set content type for text files for browser preview if possible
  if (/\.html?$/.test(relativePath)) res.type("text/html");
  else if (/\.css$/.test(relativePath)) res.type("text/css");
  else if (/\.js$/.test(relativePath)) res.type("application/javascript");
  else if (/\.txt$/.test(relativePath)) res.type("text/plain");
  else res.type("application/octet-stream"); // Default for others
  res.sendFile(fullPath); // Send the file directly
});

/**
 * Handles file uploads from the frontend. It expects an array of files and a corresponding
 * array of file paths. It then reconstructs the original folder structure in the `_input` directory.
 * This endpoint is the primary way to get course content into the application for processing.
 */
app.post("/api/upload", upload.array("files"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    // Ensure req.body.filePaths is an array and matches the number of files
    if (!req.body.filePaths || !Array.isArray(req.body.filePaths) || req.body.filePaths.length !== req.files.length) {
      console.error("Mismatched file and path count or filePaths missing.");
      return res.status(400).json({ error: "File paths not provided correctly." });
    }

    // Clear the input directory before processing new files to ensure a clean state.
    await fs.emptyDir(INPUT_DIR);

    for (const [index, file] of req.files.entries()) {
      const explicitRelativePath = req.body.filePaths[index]; // Get the path from the explicit field sent by the client.

      // Basic security check: ensure the path doesn't try to escape the directory
      if (explicitRelativePath.includes("..") || path.isAbsolute(explicitRelativePath)) {
          console.warn("Attempted path traversal detected:", explicitRelativePath);
          continue; // Skip this file or handle as an error
      }

      // Use the explicitRelativePath to construct the full destination path inside the `_input` directory.
      const destinationPath = path.join(INPUT_DIR, explicitRelativePath);
			
      await fs.ensureDir(path.dirname(destinationPath)); // Ensure parent directories exist before writing the file.
      await fs.writeFile(destinationPath, file.buffer); // Write the file buffer
    }
    res.json({ ok: true, message: "Files uploaded successfully!" });
  } catch (err) {
    console.error("Error during file upload:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Saves the provided content to a specified file path.
 * Expects a JSON body: { path: "path/to/file.html", content: "..." }
 */
app.post('/api/save', async (req, res) => {
    const { path: relativePath, content } = req.body;

    if (!relativePath || content === undefined) {
        return res.status(400).json({ message: 'Missing path or content in request body.' });
    }

    // --- Security Check: Path Traversal ---
    // This is a critical security measure to prevent writing files outside the INPUT_DIR directory.
    const absoluteTargetPath = path.join(INPUT_DIR, relativePath);

    // By resolving and comparing, we ensure the target is safely within the intended folder.
    if (!path.resolve(absoluteTargetPath).startsWith(path.resolve(INPUT_DIR))) {
        return res.status(403).json({ message: 'Forbidden: Attempted to write outside of the allowed directory.' });
    }
    // --- End Security Check ---

    try {
        // Ensure the directory for the file exists before writing.
        await fs.ensureDir(path.dirname(absoluteTargetPath));

        // Write the file content.
        await fs.writeFile(absoluteTargetPath, content, 'utf8');
        
        res.status(200).json({ message: 'File saved successfully.' });
    } catch (error) {
        console.error(`Error saving file ${relativePath}:`, error);
        res.status(500).json({ message: `Failed to save file: ${error.message}` });
    }
});

/**
 * Saves multiple files from a batch request.
 * Expects a JSON body: { files: [{ path: "path/to/file.html", content: "..." }, ...] }
 */
app.post('/api/save-all', async (req, res) => {
    const { files } = req.body;

    if (!Array.isArray(files) || files.length === 0) {
        return res.status(400).json({ message: 'Missing or empty files array in request body.' });
    }

    try {
        await Promise.all(files.map(async (file) => {
            const { path: relativePath, content } = file;

            if (!relativePath || content === undefined) {
                throw new Error('Invalid file object in batch: missing path or content.');
            }

            const absoluteTargetPath = path.join(INPUT_DIR, relativePath);

            if (!path.resolve(absoluteTargetPath).startsWith(path.resolve(INPUT_DIR))) {
                // Log the attempt but throw a generic error to the client.
                console.warn(`Forbidden: Attempted to write ${relativePath} outside of the allowed directory during batch save.`);
                throw new Error('Forbidden: Attempted to write outside of the allowed directory.');
            }

            await fs.ensureDir(path.dirname(absoluteTargetPath));
            await fs.writeFile(absoluteTargetPath, content, 'utf8');
        }));

        res.status(200).json({ message: 'All files saved successfully.' });
    } catch (error) {
        console.error(`Error during batch save:`, error);
        res.status(500).json({ message: `Failed to save files: ${error.message}` });
    }
});

/**
 * Triggers the Gulp "log" task, which is expected to perform the main processing
 * on the files in the `_input` directory. After the task completes, it reads the
 * generated report and sends it back to the client.
 * Can optionally scan a single file if a `path` is provided in the request body.
 */
app.post("/api/scan", async (req, res) => {
	try {
    const { path: singleFilePath } = req.body || {}; // Default to an empty object if body is not present

    // Determine the target for the scan.
    // If a specific file path is provided, use it. Otherwise, use the whole input directory.
    const scanTarget = singleFilePath 
        ? path.join(INPUT_DIR, singleFilePath)
        : INPUT_DIR;

    // Security check: ensure the path is within INPUT_DIR if provided
    if (singleFilePath) {
        const resolvedScanTarget = path.resolve(scanTarget);
        const resolvedInputDir = path.resolve(INPUT_DIR);
        if (!resolvedScanTarget.startsWith(resolvedInputDir)) {
            return res.status(403).json({ ok: false, error: "Forbidden: Attempted to scan outside of the allowed directory." });
        }
        if (!(await fs.pathExists(scanTarget))) {
            return res.status(404).json({ ok: false, error: "File to scan not found." });
        }
    }
    
    const { summary, byFile, reportText } = await runWebScan(scanTarget);

    // Only write the full report to disk, not partial (single-file) scans.
    if (!singleFilePath) {
      const reportPath = path.join(REPORTS_DIR, "log-output.txt");
      await fs.ensureDir(REPORTS_DIR);
      await fs.writeFile(reportPath, reportText, "utf8");
    }

    // return JSON for the React UI
    return res.json({
      ok: true,
      summary,
      byFile,      // { "path/to/file.html": [{message: "..."}], ... }
      reportText,  // optional: if you want to show the raw text log too
    });
  } catch (err) {
    console.error("Error in /api/scan:", err);
    return res.status(500).json({ ok: false, error: String(err) });
  }
});

/**
 * Lists all files and folders within the `_input` directory recursively.
 * This endpoint provides the data needed for the frontend to render the file tree view.
 */
app.get("/api/list", async (_req, res) => {
  try {
    const filesAndFolders = [];
    // Define a recursive function to walk through the directory structure.
    const walk = async (dir, base = "") => {
      const directoryEntries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of directoryEntries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(base, entry.name); // Correctly build relative path

        if (entry.isDirectory()) {
          filesAndFolders.push({
            path: relativePath,
            type: "folder", // Explicitly mark as folder
            name: entry.name // Just the folder name
          });
          await walk(fullPath, relativePath); // Recurse into directory
        } else {
          filesAndFolders.push({
            path: relativePath,
            type: "file", // Explicitly mark as file
            name: entry.name, // Just the file name
            size: (await fs.stat(fullPath)).size // Include size for files
          });
        }
      }
    };

    await walk(INPUT_DIR);
    res.json({ files: filesAndFolders }); // Send the structured list

  } catch (err) {
    console.error("Error in /api/list:", err);
    res.status(500).json({ error: String(err) });
  }
});

/**
 * Cleans the files from the `_input` directory and places them in the `_output` directory.
 */
app.get("/api/clean", async (req, res) => {
  try {
    // First, ensure the output directory is completely empty. This prevents
    // files from previous runs from being included.
    await fs.emptyDir(OUTPUT_DIR);
    // Now, run the 'clean' script. This script reads from the `_input` directory,
    // processes the files, and writes the cleaned versions to the `_output` directory.
    await execa("npm", ["run", "clean"]);
    res.status(200).json({ ok: true, message: "Files cleaned successfully." });
  } catch (err) {
    console.error("Error during file cleaning:", err);
    res.status(500).json({ ok: false, error: err.message || "Failed to clean files." });
  }
});

/** ---------- Start ---------- */
async function startServer() {
  try {
    // Ensure directories exist before starting the server
    await fs.ensureDir(INPUT_DIR);
    await fs.ensureDir(OUTPUT_DIR);
    await fs.ensureDir(REPORTS_DIR);

    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

startServer();