const textFormatter = {
  name: "text",
  config: {
    contentType: "text/plain"
  },
  handler: () => {
    return {
      parseChunk: (chunk) => {
        return chunk.text;
      },
      parseMessage: (message) => {
        return message.text;
      }
    };
  }
};
export {
  textFormatter
};
//# sourceMappingURL=text.mjs.map