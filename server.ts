import { spawn } from "child_process";
import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";

const PORT = 3000;
const ROOT_DIR = process.cwd();

function runPythonBridge(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", ["-m", "python_bank_system.bridge"], {
      cwd: ROOT_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      if (stdout.trim()) {
        try {
          resolve(JSON.parse(stdout.trim()));
          return;
        } catch (parseErr) {
          reject(new Error(`Invalid JSON from Python bridge: ${stdout} (${parseErr})`));
          return;
        }
      }
      reject(new Error(`Python bridge exited with code ${code}: ${stderr}`));
    });

    proc.stdin.write(JSON.stringify(payload));
    proc.stdin.end();
  });
}

function runPythonCommand(args: string[]): Promise<{ exitCode: number; output: string }> {
  return new Promise((resolve, reject) => {
    const proc = spawn("python3", args, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.stderr.on("data", (chunk) => {
      output += chunk.toString();
    });
    proc.on("error", (err) => reject(err));
    proc.on("close", (code) => {
      resolve({ exitCode: code ?? 1, output });
    });
  });
}

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get("/api/bank/state", async (_req, res) => {
    try {
      const data = await runPythonBridge({ action: "state" });
      res.json(data);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error_type: "ServerBridgeError",
        error: err instanceof Error ? err.message : "Failed to load Python bank state.",
      });
    }
  });

  app.post("/api/bank/action", async (req, res) => {
    try {
      const data = await runPythonBridge(req.body ?? {});
      if (data.ok === false) {
        res.status(400).json(data);
        return;
      }
      res.json(data);
    } catch (err) {
      res.status(500).json({
        ok: false,
        error_type: "ServerBridgeError",
        error: err instanceof Error ? err.message : "Python execution failed.",
      });
    }
  });

  app.get("/api/python/files", (_req, res) => {
    const fileList = [
      { key: "main.py", path: "python_bank_system/main.py", role: "Standalone CLI Entry Point" },
      { key: "models.py", path: "python_bank_system/models.py", role: "Classes, Abstraction (abc), Encapsulation, Inheritance" },
      { key: "exceptions.py", path: "python_bank_system/exceptions.py", role: "Custom BankError Exception Hierarchy" },
      { key: "storage.py", path: "python_bank_system/storage.py", role: "CSV & Text File Handling with OSError Guards" },
      { key: "cli.py", path: "python_bank_system/cli.py", role: "Interactive Terminal CLI Menu" },
      { key: "tests/test_bank.py", path: "python_bank_system/tests/test_bank.py", role: "Unittest Verification Suite" },
      { key: "requirements.txt", path: "python_bank_system/requirements.txt", role: "Standard Library Dependency Notes" },
      { key: "README.md", path: "python_bank_system/README.md", role: "Internship Documentation & Run Guide" },
    ];

    const files = fileList.map((entry) => {
      const absPath = path.resolve(ROOT_DIR, entry.path);
      const content = fs.existsSync(absPath) ? fs.readFileSync(absPath, "utf-8") : "";
      return {
        ...entry,
        content,
        lines: content ? content.split("\n").length : 0,
      };
    });

    res.json({ ok: true, files });
  });

  app.post("/api/python/run-tests", async (_req, res) => {
    try {
      const result = await runPythonCommand([
        "-m",
        "unittest",
        "discover",
        "-s",
        "python_bank_system/tests",
        "-v",
      ]);
      res.json({
        ok: result.exitCode === 0,
        exitCode: result.exitCode,
        output: result.output,
      });
    } catch (err) {
      res.status(500).json({
        ok: false,
        exitCode: 1,
        output: err instanceof Error ? err.message : "Failed to run Python unittest.",
      });
    }
  });

  app.get("/api/python/download-zip", (_req, res) => {
    const pyScript = `
import io, os, sys, zipfile
buf = io.BytesIO()
root = "python_bank_system"
with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d != "__pycache__"]
        for fn in filenames:
            if fn.endswith(".pyc"):
                continue
            full = os.path.join(dirpath, fn)
            zf.write(full, full)
sys.stdout.buffer.write(buf.getvalue())
`;
    const proc = spawn("python3", ["-c", pyScript], { cwd: ROOT_DIR });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("close", (code) => {
      if (code !== 0) {
        res.status(500).send("Failed to archive Python project.");
        return;
      }
      const zipBuffer = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="python_bank_system.zip"');
      res.send(zipBuffer);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(ROOT_DIR, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Meridian Ledger server running on http://localhost:${PORT}`);
  });
}

startServer();
