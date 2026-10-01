import { getGenkitClientHeader } from "./common";
function predictEndpoint(options) {
  return `https://generativelanguage.googleapis.com/${options.apiVersion}/models/${options.model}:${options.method}?key=${options.apiKey}`;
}
function opCheckEndpoint(options) {
  return `https://generativelanguage.googleapis.com/${options.apiVersion}/${options.operation}?key=${options.apiKey}`;
}
function predictModel(model, apiKey, method) {
  return async (instances, parameters) => {
    const fetch = (await import("node-fetch")).default;
    const req = {
      instances,
      parameters
    };
    const response = await fetch(
      predictEndpoint({
        model,
        apiVersion: "v1beta",
        apiKey,
        method
      }),
      {
        method: "POST",
        body: JSON.stringify(req),
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Client": getGenkitClientHeader()
        }
      }
    );
    if (!response.ok) {
      throw new Error(
        `Error from Gemini AI predict: HTTP ${response.status}: ${await response.text()}`
      );
    }
    return await response.json();
  };
}
async function checkOp(operation, apiKey) {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(
    opCheckEndpoint({
      apiVersion: "v1beta",
      operation,
      apiKey
    }),
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Client": getGenkitClientHeader()
      }
    }
  );
  if (!response.ok) {
    throw new Error(
      `Error from operation API: HTTP ${response.status}: ${await response.text()}`
    );
  }
  return await response.json();
}
export {
  checkOp,
  predictModel
};
//# sourceMappingURL=predict.mjs.map