import ngrok from "ngrok";
import { exec } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";
import config from "../ngrok.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function findAvailablePort(startPort = 19000, endPort = 19010) {
  for (let port = startPort; port <= endPort; port++) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      // Port is in use, continue to next port
    } catch (error) {
      // Port is available
      return port;
    }
  }
  throw new Error("No available ports found");
}

async function waitForExpo(port, timeout = 60000) {
  return new Promise((resolve, reject) => {
    let expoStarted = false;

    // Start Expo with output handling
    const expo = exec(`npx expo start --port ${port} --non-interactive`, (error, stdout, stderr) => {
      if (error && !expoStarted) {
        console.error(`Expo error: ${error}`);
        reject(error);
      }
    });

    // Listen for Expo output
    expo.stdout.on("data", (data) => {
      const output = data.toString();
      console.log(output);

      // Check for multiple possible ready states
      if (
        output.includes(`Waiting on http://localhost:${port}`) ||
        output.includes("Web Bundled") ||
        output.includes("Development server is ready")
      ) {
        if (!expoStarted) {
          expoStarted = true;
          // Wait a bit more to ensure everything is ready
          setTimeout(() => {
            resolve({ expo, port });
          }, 2000);
        }
      }
    });

    expo.stderr.on("data", (data) => {
      console.error(data.toString());
    });

    // Check for timeout
    const timeoutCheck = setTimeout(() => {
      if (!expoStarted) {
        expo.kill();
        reject(new Error("Timeout waiting for Expo to start"));
      }
    }, timeout);

    // Cleanup on error
    expo.on("error", (error) => {
      clearTimeout(timeoutCheck);
      reject(error);
    });

    // Handle early exit
    expo.on("exit", (code) => {
      if (!expoStarted) {
        clearTimeout(timeoutCheck);
        reject(new Error(`Expo process exited with code ${code}`));
      }
    });
  });
}

async function startTunnel() {
  try {
    console.log("Finding available port...");
    const port = await findAvailablePort();
    console.log(`Using port ${port}`);

    console.log("Starting Expo development server...");
    const { expo } = await waitForExpo(port);

    // Wait a bit more after Expo is ready before starting ngrok
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("Starting ngrok tunnel...");
    const url = await ngrok.connect({
      authtoken: config.authtoken,
      addr: port,
      proto: "http",
    });

    console.log("\n🌍 Your app is available at:");
    console.log(url);

    // Handle cleanup
    process.on("SIGINT", async () => {
      console.log("\nShutting down...");
      await ngrok.kill();
      expo.kill();
      process.exit(0);
    });

    // Handle process termination
    process.on("SIGTERM", async () => {
      console.log("\nTerminating...");
      await ngrok.kill();
      expo.kill();
      process.exit(0);
    });
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

startTunnel();
