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
var context_exports = {};
__export(context_exports, {
  fakeToken: () => fakeToken,
  firebaseContext: () => firebaseContext,
  setDebugSkipTokenVerification: () => setDebugSkipTokenVerification
});
module.exports = __toCommonJS(context_exports);
var import_app_check = require("firebase-admin/app-check");
var import_auth = require("firebase-admin/auth");
var import_genkit = require("genkit");
var import_helpers = require("./helpers.js");
let cachedDebugSkipTokenVerification;
function setDebugSkipTokenVerification(skip) {
  cachedDebugSkipTokenVerification = skip;
}
function debugSkipTokenVerification() {
  if (cachedDebugSkipTokenVerification !== void 0) {
    return cachedDebugSkipTokenVerification;
  }
  if (!process.env.FIREBASE_DEBUG_MODE) {
    return false;
  }
  if (!process.env.FIREBASE_DEBUG_FEATURES) {
    return false;
  }
  const features = JSON.parse(
    process.env.FIREBASE_DEBUG_FEATURES
  );
  cachedDebugSkipTokenVerification = features.skipTokenVerification ?? false;
  return cachedDebugSkipTokenVerification;
}
function firebaseContext(policy) {
  return async (request) => {
    (0, import_helpers.initializeAppIfNecessary)();
    let auth;
    const authIdToken = extractBearerToken(request.headers["authorization"]);
    const appCheckToken = request.headers["x-firebase-appcheck"];
    if ("authorization" in request.headers) {
      auth = await verifyAuthToken(authIdToken);
    }
    let app;
    if ("x-firebase-appcheck" in request.headers) {
      const consumeAppCheckToken = typeof policy === "object" && policy["consumeAppCheckToken"];
      app = await verifyAppCheckToken(
        appCheckToken,
        consumeAppCheckToken ?? false
      );
    }
    let instanceIdToken;
    if ("firebase-instance-id-token" in request.headers) {
      instanceIdToken = request.headers["firebase-instance-id-token"];
    }
    const context = {};
    if (typeof policy === "object" && policy.serverAppConfig) {
      const { initializeServerApp } = await import("firebase/app");
      context.firebaseApp = initializeServerApp(policy.serverAppConfig, {
        appCheckToken,
        authIdToken,
        releaseOnDeref: context
      });
    }
    if (auth) {
      context.auth = auth;
    }
    if (app) {
      context.app = app;
    }
    if (instanceIdToken) {
      context.instanceIdToken = instanceIdToken;
    }
    if (typeof policy === "function") {
      await policy(context, request.input);
    } else if (typeof policy === "object") {
      enforceDelcarativePolicy(policy, context);
    }
    return context;
  };
}
function verifyHasClaims(claims, token) {
  for (const claim of claims) {
    if (!token[claim] || token[claim] === "false") {
      if (claim == "email_verified") {
        throw new import_genkit.UserFacingError(
          "PERMISSION_DENIED",
          "Email must be verified"
        );
      }
      if (claim === "admin") {
        throw new import_genkit.UserFacingError("PERMISSION_DENIED", "Must be an admin");
      }
      throw new import_genkit.UserFacingError(
        "PERMISSION_DENIED",
        `${claim} claim is required`
      );
    }
  }
}
function enforceDelcarativePolicy(policy, context) {
  if ((policy.signedIn || policy.hasClaim || policy.emailVerified) && !context.auth) {
    throw new import_genkit.UserFacingError("UNAUTHENTICATED", "Auth is required");
  }
  if (policy.hasClaim) {
    if (typeof policy.hasClaim === "string") {
      verifyHasClaims([policy.hasClaim], context.auth.token);
    } else if (Array.isArray(policy.hasClaim)) {
      verifyHasClaims(policy.hasClaim, context.auth.token);
    } else if (typeof policy.hasClaim === "object") {
      for (const [claim, value] of Object.entries(policy.hasClaim)) {
        if (context.auth.token[claim] !== value) {
          throw new import_genkit.UserFacingError(
            "PERMISSION_DENIED",
            `Claim ${claim} must be ${value}`
          );
        }
      }
    } else {
      throw Error(`Invalid type ${typeof policy.hasClaim} for hasClaim`);
    }
  }
  if (policy.emailVerified) {
    verifyHasClaims(["email_verified"], context.auth.token);
  }
  if (policy.enforceAppCheck && !context.app) {
    throw new import_genkit.UserFacingError(
      "PERMISSION_DENIED",
      `AppCheck token is required`
    );
  }
}
function extractBearerToken(authHeader) {
  return /[bB]earer (.*)/.exec(authHeader)?.[1];
}
async function verifyAuthToken(token) {
  if (!token) {
    return void 0;
  }
  if (debugSkipTokenVerification()) {
    const decoded = unsafeDecodeToken(token);
    return {
      uid: decoded["sub"],
      token: decoded,
      rawToken: token
    };
  }
  try {
    const decoded = await (0, import_auth.getAuth)().verifyIdToken(token);
    return {
      uid: decoded["sub"],
      token: decoded,
      rawToken: token
    };
  } catch (err) {
    console.error(`Error decoding auth token: ${err}`);
    throw new import_genkit.UserFacingError("PERMISSION_DENIED", "Invalid auth token");
  }
}
async function verifyAppCheckToken(token, consumeAppCheckToken) {
  if (debugSkipTokenVerification()) {
    const decoded = unsafeDecodeToken(token);
    return {
      appId: decoded["sub"],
      token: decoded,
      alreadyConsumed: false,
      rawToken: token
    };
  }
  try {
    return {
      ...await (0, import_app_check.getAppCheck)().verifyToken(token, {
        consume: consumeAppCheckToken
      }),
      rawToken: token
    };
  } catch (err) {
    console.error(`Got error verifying AppCheck token: ${err}`);
    throw new import_genkit.UserFacingError("PERMISSION_DENIED", "Invalid AppCheck token");
  }
}
function fakeToken(claims) {
  return `fake.${Buffer.from(JSON.stringify(claims), "utf-8").toString("base64")}.fake`;
}
const TOKEN_REGEX = /[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_=-]+\.[a-zA-Z0-9_=-]+/;
function unsafeDecodeToken(token) {
  if (!TOKEN_REGEX.test(token)) {
    throw new import_genkit.UserFacingError(
      "PERMISSION_DENIED",
      "Invalid fake token. Use the fakeToken() method to create a valid fake token"
    );
  }
  try {
    return JSON.parse(Buffer.from(token.split(".")[1], "base64").toString());
  } catch (err) {
    throw new import_genkit.UserFacingError(
      "PERMISSION_DENIED",
      "Invalid fake token. Use the fakeToken() method to create a valid fake token"
    );
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  fakeToken,
  firebaseContext,
  setDebugSkipTokenVerification
});
//# sourceMappingURL=context.js.map