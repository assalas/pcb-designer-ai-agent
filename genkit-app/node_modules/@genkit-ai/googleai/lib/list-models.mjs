async function listModels(baseUrl, apiKey) {
  const res = await fetch(
    `${baseUrl}/v1beta/models?pageSize=1000&key=${apiKey}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
  const modelResponse = JSON.parse(await res.text());
  return modelResponse.models;
}
export {
  listModels
};
//# sourceMappingURL=list-models.mjs.map