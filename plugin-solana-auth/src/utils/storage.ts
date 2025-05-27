import { IAgentRuntime } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";

export async function storeData(
  key: string,
  data: string | null,
  storageType: string,
  runtime: IAgentRuntime
): Promise<void> {
  switch (storageType) {
    case "encrypted-file":
      await storeInFile(key, data, runtime);
      break;
    case "database":
      await storeInDatabase(key, data, runtime);
      break;
    case "memory":
      // No persistent storage needed
      break;
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}

export async function retrieveData(
  key: string,
  storageType: string,
  runtime: IAgentRuntime
): Promise<string | null> {
  switch (storageType) {
    case "encrypted-file":
      return await retrieveFromFile(key, runtime);
    case "database":
      return await retrieveFromDatabase(key, runtime);
    case "memory":
      return null; // Memory-only storage doesn't persist
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}

async function storeInFile(key: string, data: string | null, runtime: IAgentRuntime): Promise<void> {
  const storageDir = path.join(process.cwd(), "data", "auth");
  
  // Ensure directory exists
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const filePath = path.join(storageDir, `${key}.auth`);
  
  if (data === null) {
    // Delete file if data is null
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return;
  }
  
  // Write data to file
  fs.writeFileSync(filePath, data, "utf8");
}

async function retrieveFromFile(key: string, runtime: IAgentRuntime): Promise<string | null> {
  const filePath = path.join(process.cwd(), "data", "auth", `${key}.auth`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, "utf8");
}

async function storeInDatabase(key: string, data: string | null, runtime: IAgentRuntime): Promise<void> {
  // In a real implementation, this would store data in a database
  // For demonstration, we'll use the runtime's database adapter
  
  const databaseAdapter = runtime.databaseAdapter;
  
  if (!databaseAdapter) {
    throw new Error("No database adapter available");
  }
  
  if (data === null) {
    // Delete data if null
    await databaseAdapter.delete("auth_state", { key });
    return;
  }
  
  // Store data
  await databaseAdapter.upsert("auth_state", { key, data });
}

async function retrieveFromDatabase(key: string, runtime: IAgentRuntime): Promise<string | null> {
  // In a real implementation, this would retrieve data from a database
  // For demonstration, we'll use the runtime's database adapter
  
  const databaseAdapter = runtime.databaseAdapter;
  
  if (!databaseAdapter) {
    throw new Error("No database adapter available");
  }
  
  const result = await databaseAdapter.findOne("auth_state", { key });
  
  if (!result) {
    return null;
  }
  
  return result.data;
}
