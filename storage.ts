import { IAgentRuntime } from "@elizaos/core";
import * as fs from "fs";
import * as path from "path";

/**
 * Stores data in the specified storage type
 * @param key Unique identifier for the data
 * @param data Data to store, or null to delete
 * @param storageType Storage type (encrypted-file, database, memory)
 * @param runtime Agent runtime
 */
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
      // No persistent storage needed for memory-only storage
      break;
    default:
      throw new Error(`Unsupported storage type: ${storageType}`);
  }
}

/**
 * Retrieves data from the specified storage type
 * @param key Unique identifier for the data
 * @param storageType Storage type (encrypted-file, database, memory)
 * @param runtime Agent runtime
 * @returns Retrieved data, or null if not found
 */
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

/**
 * Stores data in a file
 * @param key Unique identifier for the data
 * @param data Data to store, or null to delete
 * @param runtime Agent runtime
 */
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

/**
 * Retrieves data from a file
 * @param key Unique identifier for the data
 * @param runtime Agent runtime
 * @returns Retrieved data, or null if not found
 */
async function retrieveFromFile(key: string, runtime: IAgentRuntime): Promise<string | null> {
  const filePath = path.join(process.cwd(), "data", "auth", `${key}.auth`);
  
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  return fs.readFileSync(filePath, "utf8");
}

/**
 * Stores data in a database
 * @param key Unique identifier for the data
 * @param data Data to store, or null to delete
 * @param runtime Agent runtime
 */
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

/**
 * Retrieves data from a database
 * @param key Unique identifier for the data
 * @param runtime Agent runtime
 * @returns Retrieved data, or null if not found
 */
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
