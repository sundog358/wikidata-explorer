import { spawn } from "node:child_process";

export class Ag2BridgeError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "Ag2BridgeError";
    this.status = status;
  }
}

type Ag2Payload =
  | {
      mode: "entity_summary";
      entity: unknown;
    }
  | {
      mode: "workflow";
      action: "research" | "graph" | "verify" | "compare" | "report";
      entity?: unknown;
      entityId?: string;
      compareEntityId?: string;
    }
  | {
      mode: "chat";
      messages: Array<{ role: string; content: string }>;
    };

type Ag2Result = {
  ok?: boolean;
  status?: number;
  error?: string;
  summary?: string;
  message?: string;
  result?: string;
};

function pythonCommand() {
  const explicitPython = process.env.AG2_PYTHON;
  if (explicitPython) {
    return { command: explicitPython, args: [] as string[] };
  }

  const envName = process.env.AG2_CONDA_ENV || "wikidata";
  const userProfile = process.env.USERPROFILE;
  if (userProfile) {
    return {
      command: `${userProfile}\\miniconda3\\envs\\${envName}\\python.exe`,
      args: [] as string[],
    };
  }

  return { command: "conda", args: ["run", "-n", envName, "python"] };
}

function parseAg2Json(stdout: string): Ag2Result {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines.reverse()) {
    if (!line.startsWith("{") || !line.endsWith("}")) continue;
    try {
      return JSON.parse(line) as Ag2Result;
    } catch {
      // Keep looking for a machine-readable line.
    }
  }

  throw new Ag2BridgeError("AG2 returned an unreadable response.", 502);
}

export async function runAg2Agent(payload: Ag2Payload, timeoutMs = 45000): Promise<Ag2Result> {
  const { command, args } = pythonCommand();
  const scriptPath = "agents/wikidata_ag2_agent.py";
  const child = spawn(command, [...args, scriptPath], {
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });

  let stdout = "";
  let stderr = "";
  let settled = false;

  const timer = setTimeout(() => {
    if (settled) return;
    child.kill();
  }, timeoutMs);

  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  child.stdin.end(JSON.stringify(payload));

  return await new Promise((resolve, reject) => {
    child.on("error", (error) => {
      settled = true;
      clearTimeout(timer);
      reject(new Ag2BridgeError(`Could not start AG2 runtime: ${error.message}`, 500));
    });

    child.on("close", () => {
      settled = true;
      clearTimeout(timer);

      try {
        const result = parseAg2Json(stdout);
        if (!result.ok) {
          reject(new Ag2BridgeError(result.error || "AG2 agent failed.", result.status || 500));
          return;
        }
        resolve(result);
      } catch (error) {
        console.error("AG2 bridge stderr:", stderr.slice(0, 2000));
        reject(error instanceof Error ? error : new Ag2BridgeError("AG2 bridge failed."));
      }
    });
  });
}

