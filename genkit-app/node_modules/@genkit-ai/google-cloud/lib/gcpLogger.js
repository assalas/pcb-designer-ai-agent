"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var gcpLogger_exports = {};
__export(gcpLogger_exports, {
  GcpLogger: () => GcpLogger,
  __addTransportStreamForTesting: () => __addTransportStreamForTesting,
  __useJsonFormatForTesting: () => __useJsonFormatForTesting
});
module.exports = __toCommonJS(gcpLogger_exports);
var import_logging_winston = require("@google-cloud/logging-winston");
var import_genkit = require("genkit");
var import_logging = require("genkit/logging");
var import_utils = require("./utils.js");
let additionalStream;
let useJsonFormatOverride = false;
class GcpLogger {
  constructor(config) {
    this.config = config;
  }
  async getLogger(env) {
    const winston = await import("winston");
    const format = useJsonFormatOverride || this.shouldExport(env) ? { format: winston.format.json() } : {
      format: winston.format.printf((info) => {
        return `[${info.level}] ${info.message}`;
      })
    };
    const transports = [];
    transports.push(
      this.shouldExport(env) ? new import_logging_winston.LoggingWinston({
        labels: { module: "genkit" },
        prefix: "genkit",
        logName: "genkit_log",
        projectId: this.config.projectId,
        credentials: this.config.credentials,
        autoRetry: true,
        defaultCallback: await this.getErrorHandler()
      }) : new winston.transports.Console()
    );
    if (additionalStream) {
      transports.push(
        new winston.transports.Stream({ stream: additionalStream })
      );
    }
    return winston.createLogger({
      transports,
      ...format,
      exceptionHandlers: [new winston.transports.Console()]
    });
  }
  async getErrorHandler() {
    let instructionsLogged = false;
    const helpInstructions = await (0, import_utils.loggingDeniedHelpText)();
    return async (err) => {
      const defaultLogger = import_logging.logger.defaultLogger;
      if (err && (0, import_utils.loggingDenied)(err)) {
        if (!instructionsLogged) {
          instructionsLogged = true;
          defaultLogger.error(
            `Unable to send logs to Google Cloud: ${err.message}

${helpInstructions}
`
          );
        }
      } else if (err) {
        defaultLogger.error(`Unable to send logs to Google Cloud: ${err}`);
      }
      if (err) {
        import_logging.logger.init(
          await new GcpLogger(this.config).getLogger((0, import_genkit.getCurrentEnv)())
        );
        defaultLogger.info("Initialized a new GcpLogger.");
      }
    };
  }
  shouldExport(env) {
    return this.config.export;
  }
}
function __addTransportStreamForTesting(stream) {
  additionalStream = stream;
}
function __useJsonFormatForTesting() {
  useJsonFormatOverride = true;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  GcpLogger,
  __addTransportStreamForTesting,
  __useJsonFormatForTesting
});
//# sourceMappingURL=gcpLogger.js.map