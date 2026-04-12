export interface StorageKeys {
  anthropicKey?: string;
  githubToken?: string;
}

const STORAGE_FIELDS: (keyof StorageKeys)[] = ["anthropicKey", "githubToken"];

export async function getApiKeys(): Promise<StorageKeys> {
  const result = await chrome.storage.sync.get(STORAGE_FIELDS);
  return {
    anthropicKey: result.anthropicKey as string | undefined,
    githubToken: result.githubToken as string | undefined,
  };
}

export async function setApiKeys(keys: StorageKeys): Promise<void> {
  await chrome.storage.sync.set(keys);
}

export async function clearApiKeys(): Promise<void> {
  await chrome.storage.sync.remove(STORAGE_FIELDS);
}
