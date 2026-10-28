import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import fs from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const ROOT = await fs.realpath(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
);
const WORK = path.join(ROOT, ".context/e2e");
const LOCK = path.join(WORK, "command.lock");
const PROJECT = `ipa-e2e-${createHash("sha256").update(ROOT).digest("hex").slice(0, 12)}`;
const flags = process.argv.slice(2);
const allowed = new Set([
  "--stress",
  "--ci",
  "--reset",
  "--down",
  "--quarantine",
]);
assert(
  flags.length <= 1 && flags.every((flag) => allowed.has(flag)),
  "Choose one supported E2E mode",
);
const MODE = flags[0]?.slice(2) ?? "baseline";
assert(
  Number(process.versions.node.split(".")[0]) >= 24,
  "Use Node24 or later",
);
const manifest = JSON.parse(
  await fs.readFile(path.join(ROOT, "e2e/backend.json"), "utf8"),
);
assert(
  /^[0-9a-f]{40}$/.test(manifest.commit),
  "Backend commit must be immutable",
);
assert.equal(manifest.repository, "IngenieriaParaLaAlimentacion/backend");
assert.equal(
  manifest.image,
  `ghcr.io/ingenieriaparalaalimentacion/backend:sha-${manifest.commit}`,
);
const invocation = `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`;
const artifacts = path.join(WORK, "artifacts", invocation);
const upstream = path.join(WORK, "upstream", manifest.commit);
const children = new Set();
let interrupted = null;
let stackTouched = false;
let lockOwned = false;
let keepBackend = false;
let composeFile;

const childEnv = {
  ...process.env,
  E2E_BASE_URL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3001",
  E2E_API_URL: process.env.E2E_API_URL ?? "http://127.0.0.1:8080",
  NEXT_PUBLIC_API_BASE_URL: "http://127.0.0.1:8080",
  NEXT_PUBLIC_ENABLE_MSW: "false",
  BACKEND_IMAGE: manifest.image,
};
for (const [key, expected] of [
  ["E2E_BASE_URL", "http://127.0.0.1:3001"],
  ["E2E_API_URL", "http://127.0.0.1:8080"],
]) {
  const url = new URL(childEnv[key]);
  assert.equal(
    url.href,
    `${expected}/`,
    `${key} must target the dedicated local origin without a path or credentials`,
  );
  childEnv[key] = url.origin;
}

function signalGroup(handle, signal) {
  if (handle.exited || !handle.child.pid) return;
  try {
    process.kill(-handle.child.pid, signal);
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
}

function launch(
  command,
  args,
  { env = {}, cwd = ROOT, logFile, cleanup = false, echo = true } = {},
) {
  if (interrupted && !cleanup) throw new Error(`Interrupted by ${interrupted}`);
  const log = logFile ? createWriteStream(logFile, { flags: "a" }) : null;
  const child = spawn(command, args, {
    cwd,
    env: { ...childEnv, ...env },
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const handle = { child, exited: false, spawnError: null, done: null };
  children.add(handle);
  let output = "";
  const write = (chunk, target) => {
    output += chunk.toString();
    if (echo) target.write(chunk);
    log?.write(chunk);
  };
  child.stdout.on("data", (chunk) => write(chunk, process.stdout));
  child.stderr.on("data", (chunk) => write(chunk, process.stderr));
  handle.done = new Promise((resolve, reject) => {
    const finish = (error, code, signal) => {
      if (handle.exited) return;
      handle.exited = true;
      const complete = () => {
        children.delete(handle);
        if (error) reject(error);
        else resolve({ code, signal, output });
      };
      if (log) log.end(complete);
      else complete();
    };
    child.once("error", (error) => {
      handle.spawnError = error;
      finish(error, null, null);
    });
    child.once("close", (code, signal) => finish(null, code, signal));
  });
  // Observe an early Next spawn failure before the readiness poll awaits it.
  handle.done.catch(() => {});
  return handle;
}

async function stop(handle) {
  signalGroup(handle, "SIGTERM");
  const closed = await Promise.race([
    handle.done.then(
      () => true,
      () => true,
    ),
    delay(5000).then(() => false),
  ]);
  if (!closed) signalGroup(handle, "SIGKILL");
  await handle.done.catch(() => {});
}

async function run(command, args, options = {}) {
  const handle = launch(command, args, options);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void stop(handle).catch((error) => {
      process.stderr.write(`E2E timeout cleanup failed: ${error.message}\n`);
      process.exitCode ||= 1;
    });
  }, options.timeoutMs ?? 180_000);
  try {
    const result = await handle.done;
    if (timedOut) throw new Error(`${command} timed out`);
    if (!options.allowFailure && result.code !== 0) {
      throw new Error(
        `${command} ${args[0] ?? ""} failed (${result.code ?? result.signal})`,
      );
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    interrupted = signal;
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    for (const handle of children) signalGroup(handle, "SIGTERM");
  });
}

async function freePort(port) {
  await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", () =>
      reject(new Error(`Port ${port} is in use; stop its owner explicitly`)),
    );
    server.listen(port, "127.0.0.1", () => server.close(resolve));
  });
}

async function ready(url, timeoutMs, serverHandle) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (interrupted) throw new Error(`Interrupted by ${interrupted}`);
    if (serverHandle?.spawnError) throw serverHandle.spawnError;
    if (
      serverHandle &&
      (serverHandle.exited ||
        serverHandle.child.exitCode !== null ||
        serverHandle.child.signalCode !== null)
    ) {
      throw new Error("Owned web server exited before becoming ready");
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (response.ok) return;
    } catch {
      /* Bounded health polling; not a browser assertion. */
    }
    await delay(250);
  }
  throw new Error(`Readiness timeout: ${url}`);
}

async function backendSource() {
  if (process.env.E2E_BACKEND_DIR) {
    const head = await run("git", ["rev-parse", "HEAD"], {
      cwd: path.resolve(process.env.E2E_BACKEND_DIR),
      echo: false,
    });
    assert.equal(
      head.output.trim(),
      manifest.commit,
      "Read-only backend checkout is at the wrong commit",
    );
  }
  for (const [relative, expected] of Object.entries(manifest.files)) {
    assert(["e2e/compose.yml", "e2e/.env.e2e"].includes(relative));
    assert(/^[0-9a-f]{64}$/.test(expected));
    const destination = path.join(upstream, relative);
    let content;
    if (process.env.E2E_BACKEND_DIR) {
      content = await fs.readFile(
        path.join(path.resolve(process.env.E2E_BACKEND_DIR), relative),
      );
    } else {
      try {
        content = await fs.readFile(destination);
      } catch {
        /* Download missing source. */
      }
      if (
        !content ||
        createHash("sha256").update(content).digest("hex") !== expected
      ) {
        const url = `https://raw.githubusercontent.com/${manifest.repository}/${manifest.commit}/${relative}`;
        const response = await fetch(url, {
          signal: AbortSignal.timeout(30_000),
        });
        assert(
          response.ok,
          `Cannot retrieve canonical backend source (${response.status})`,
        );
        content = Buffer.from(await response.arrayBuffer());
      }
    }
    assert.equal(
      createHash("sha256").update(content).digest("hex"),
      expected,
      `Hash mismatch for ${relative}`,
    );
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, content);
  }
  assert.equal(
    Object.keys(manifest.files).length,
    2,
    "Exactly the two canonical files are required",
  );
  composeFile = path.join(upstream, "e2e/compose.yml");
}

async function compose(args, options = {}) {
  assert(composeFile, "Canonical Compose was not resolved");
  return run(
    "docker",
    ["compose", "--project-name", PROJECT, "-f", composeFile, ...args],
    options,
  );
}

function resultsIn(suite) {
  return [
    ...(suite.specs ?? []).flatMap((spec) =>
      spec.tests.flatMap((test) =>
        test.results.map((result) => ({ spec, test, result })),
      ),
    ),
    ...(suite.suites ?? []).flatMap(resultsIn),
  ];
}

async function stressEvidence(reportFile, role) {
  const report = JSON.parse(await fs.readFile(reportFile, "utf8"));
  assert.equal(
    report.stats.expected,
    10,
    "A proof pass must execute exactly ten tests",
  );
  for (const field of ["unexpected", "flaky", "skipped"])
    assert.equal(report.stats[field], 0, field);
  assert.equal(
    (report.errors ?? []).length,
    0,
    "Reporter-level errors invalidate the pass",
  );
  const rows = report.suites.flatMap(resultsIn);
  assert.equal(
    rows.length,
    10,
    "No retry or duplicate project may inflate proof results",
  );
  const workers = new Set();
  const proofs = [];
  for (const { spec, result } of rows) {
    assert(
      spec.title.includes("@session-stress") ||
        spec.tags?.includes("@session-stress"),
      "Unexpected test in stress proof",
    );
    assert.equal(result.status, "passed");
    assert.equal(result.retry, 0);
    workers.add(result.workerIndex);
    const attachment = result.attachments.find(
      (item) => item.name === "session-proof",
    );
    assert(attachment, "Missing session ownership evidence");
    const body = attachment.body
      ? Buffer.from(attachment.body, "base64")
      : await fs.readFile(path.resolve(ROOT, attachment.path));
    const proof = JSON.parse(body.toString("utf8"));
    assert.equal(proof.workerIndex, result.workerIndex);
    assert.equal(proof.role, role);
    assert.equal(
      proof.loginCount,
      1,
      "Role login must not be repeated within a worker",
    );
    assert(
      proof.refreshCount >= 3,
      "No real bootstrap rotations were observed",
    );
    assert(
      proof.successfulProtectedReads >= 2,
      "Missing protected API evidence",
    );
    proofs.push(proof);
  }
  assert.equal(
    workers.size,
    2,
    "Configured worker count alone is not proof of parallel execution",
  );
  return { passed: 10, workers: [...workers].sort(), role, proofs };
}

async function playwright(label, mode, summary) {
  const runDir = path.join(artifacts, label);
  await fs.mkdir(runDir, { recursive: true });
  const args = [
    path.join(ROOT, "node_modules/@playwright/test/cli.js"),
    "test",
    "--project=chromium",
  ];
  if (mode === "stress") args.push("--retries=0");
  await run(process.execPath, args, {
    env: {
      E2E_MODE: mode,
      E2E_RUN_ID: `${invocation}-${label}`,
      E2E_ARTIFACT_DIR: runDir,
    },
    logFile: path.join(runDir, "console.log"),
    timeoutMs: 11 * 60_000,
  });
  const result =
    mode === "stress"
      ? await stressEvidence(
          path.join(runDir, "report.json"),
          childEnv.E2E_STRESS_ROLE ?? "admin",
        )
      : { passed: true };
  summary.runs.push({ label, mode, ...result });
  await fs.writeFile(
    path.join(artifacts, "summary.json"),
    JSON.stringify(summary, null, 2),
  );
}

async function main() {
  await fs.mkdir(WORK, { recursive: true });
  await fs.mkdir(LOCK); // EEXIST fails closed; never steal another command's lock.
  lockOwned = true;
  await fs.writeFile(
    path.join(LOCK, "owner.json"),
    JSON.stringify({ pid: process.pid, project: PROJECT, root: ROOT }),
  );
  await fs.mkdir(artifacts, { recursive: true });
  await backendSource();
  await run("docker", ["info"], { echo: false, timeoutMs: 30_000 });
  await compose(["config", "--quiet"]);
  stackTouched = true;
  await compose(["down", "--volumes", "--remove-orphans"]);
  if (MODE === "down") return;
  await freePort(8080);
  if (MODE !== "reset") await freePort(3001);
  await compose(["pull"], {
    timeoutMs: 5 * 60_000,
    logFile: path.join(artifacts, "pull.log"),
  });
  await compose(
    ["up", "--detach", "--wait", "--wait-timeout", "240", "backend"],
    {
      timeoutMs: 5 * 60_000,
      logFile: path.join(artifacts, "backend-startup.log"),
    },
  );
  await ready(`${childEnv.E2E_API_URL}/ready`, 15_000);
  if (MODE === "reset") {
    keepBackend = true;
    return;
  }
  await run("npm", ["run", "build"], {
    timeoutMs: 5 * 60_000,
    logFile: path.join(artifacts, "build.log"),
  });
  const next = launch(
    process.execPath,
    [
      path.join(ROOT, "node_modules/next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "3001",
    ],
    {
      logFile: path.join(artifacts, "web.log"),
    },
  );
  await ready(`${childEnv.E2E_BASE_URL}/signin`, 60_000, next);
  const summary = {
    backendCommit: manifest.commit,
    backendImage: manifest.image,
    mode: MODE,
    runs: [],
  };
  if (MODE === "baseline" || MODE === "ci")
    await playwright("baseline", "baseline", summary);
  if (MODE === "quarantine")
    await playwright("quarantine", "quarantine", summary);
  if (MODE === "stress" || MODE === "ci") {
    for (let pass = 1; pass <= 5; pass += 1)
      await playwright(`stress-${pass}`, "stress", summary);
    assert.equal(summary.runs.filter((run) => run.mode === "stress").length, 5);
  }
  await stop(next);
}

try {
  await main();
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = interrupted === "SIGINT" ? 130 : interrupted ? 143 : 1;
} finally {
  try {
    // Only our children and hash-derived Compose project are addressed here.
    const stopped = await Promise.allSettled([...children].map(stop));
    for (const result of stopped) {
      if (result.status === "rejected") {
        process.stderr.write(
          `E2E child cleanup failed: ${result.reason.message}\n`,
        );
        process.exitCode ||= 1;
      }
    }
    if (stackTouched) {
      await compose(["logs", "--no-color"], {
        cleanup: true,
        allowFailure: true,
        logFile: path.join(artifacts, "backend.log"),
        timeoutMs: 30_000,
      }).catch(() => {});
      if (!keepBackend || interrupted || process.exitCode) {
        await compose(["down", "--volumes", "--remove-orphans"], {
          cleanup: true,
          timeoutMs: 60_000,
        }).catch((error) => {
          process.stderr.write(`E2E cleanup failed: ${error.message}\n`);
          process.exitCode ||= 1;
        });
      }
    }
    if (lockOwned) await fs.rm(LOCK, { recursive: true, force: true });
  } finally {
    // A signal during the last await or cleanup must never become a green run.
    if (interrupted) process.exitCode = interrupted === "SIGINT" ? 130 : 143;
  }
}
