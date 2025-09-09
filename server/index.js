// Import necessary Node.js modules and third-party libraries.
import express from "express";
import cors from "cors";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { fileURLToPath } from "url";
import { execa } from "execa"; // For running shell commands like Gulp
import archiver from "archiver"; // For creating ZIP archives

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
 * Triggers the Gulp "log" task, which is expected to perform the main processing
 * on the files in the `_input` directory. After the task completes, it reads the
 * generated report and sends it back to the client.
 */
app.post("/api/scan", async (_req, res) => {
  try {
    // Use execa to run the Gulp command from the project's root directory.
    await execa("npx", ["gulp", "log"], { cwd: path.join(__dirname, ".."), stdio: "inherit" });

    // Read the report file generated by the Gulp task.
    const reportPath = path.join(REPORTS_DIR, "log-output.txt");
    const reportContent = (await fs.pathExists(reportPath)) ? await fs.readFile(reportPath, "utf8") : "";
    res.json({ ok: true, report: reportContent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: String(err) });
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
 * Creates a ZIP archive of the contents of the `_output` directory and streams it
 * to the client for download. This is how the user gets the final, cleaned course files.
 */
app.get("/api/download", async (req, res) => {
  try {
    const archive = archiver("zip", { zlib: { level: 9 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", "attachment; filename=cleaned-course.zip");

    archive.on("error", err => res.status(500).send({ error: err.message }));
    archive.pipe(res); // Pipe the archive stream directly to the HTTP response.
    archive.directory(OUTPUT_DIR, false); // Using OUTPUT_DIR directly is cleaner
    await archive.finalize();
  } catch (err) {
    console.error("Error creating zip archive:", err);
    if (!res.headersSent) res.status(500).send({ error: "Failed to create zip file." });
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