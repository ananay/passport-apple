"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppleClientSecret = void 0;
var fs_1 = __importDefault(require("fs"));
var passport_oauth2_1 = require("passport-oauth2");
var jwt = __importStar(require("jsonwebtoken"));
var AppleClientSecret = /** @class */ (function () {
    function AppleClientSecret(options) {
        var clientID = options.clientID;
        var teamID = options.teamID;
        var keyID = options.keyID;
        var privateKey = options.privateKeyString ? options.privateKeyString : fs_1.default.readFileSync(options.privateKeyLocation).toString();
        if (!clientID) {
            throw new passport_oauth2_1.TokenError("'clientID'\uAC00 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4", "'CLIENT ID' NEED");
        }
        if (!teamID) {
            throw new passport_oauth2_1.TokenError("'teamID'\uAC00 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4", "'TEAM ID' NEED");
        }
        if (!keyID) {
            throw new passport_oauth2_1.TokenError("'keyID'\uAC00 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4", "'KEY ID' NEED");
        }
        if (!privateKey) {
            throw new passport_oauth2_1.TokenError("'privateKey'\uAC00 \uC81C\uACF5\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uB2E4", "'PRIVATE KEY' NEED");
        }
        this.config = {
            clientID: clientID,
            teamID: teamID,
            keyID: keyID,
            privateKey: privateKey,
        };
        this.generate = this.generate.bind(this);
        this.generateToken = this.generateToken.bind(this);
    }
    /**
     * Generates the JWT token
     * @param {string} clientId
     * @param {string} teamId
     * @param {string} privateKey
     * @param {string} keyId
     * @returns {Promise<string>} token
     */
    AppleClientSecret.prototype.generateToken = function (clientId, teamId, privateKey, keyId) {
        var iat = Math.floor(Date.now() / 1000); // Make it expire within 6 months
        var exp = iat + (86400 * 180); // Make it expire within 6 months
        var claims = {
            iss: teamId,
            iat: iat,
            exp: exp,
            aud: 'https://appleid.apple.com',
            sub: clientId,
            nonce: "nonce-" + Date.now()
        };
        return jwt.sign(claims, privateKey, {
            algorithm: 'ES256',
            keyid: keyId
        });
    };
    /**
     * Reads the private key file calls
     * the token generation method
     * @returns {Promise<string>} token - The generated client secret
     */
    AppleClientSecret.prototype.generate = function () {
        return this.generateToken(this.config.clientID, this.config.teamID, this.config.privateKey, this.config.keyID);
    };
    return AppleClientSecret;
}());
exports.AppleClientSecret = AppleClientSecret;
