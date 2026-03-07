function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const value = error as { code?: unknown; details?: unknown };
  return {
    code: typeof value.code === "number" ? value.code : null,
    details: typeof value.details === "string" ? value.details : "",
  };
}

export function isFirestoreSetupError(error: unknown) {
  const parsed = getErrorCode(error);
  if (!parsed) {
    return false;
  }

  return parsed.code === 7 || parsed.details.includes("Cloud Firestore API has not been used");
}

export function getFirestoreSetupMessage(error: unknown) {
  const parsed = getErrorCode(error);
  if (!parsed) {
    return "Firestore is not available yet.";
  }

  if (parsed.details) {
    return parsed.details;
  }

  return "Firestore is not available yet.";
}
