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
exports.buildOptions = void 0;
var util_1 = require("util");
var passport_oauth2_1 = __importDefault(require("passport-oauth2"));
var url = __importStar(require("url"));
var utils = require('./utils');
var uid_1 = require("uid");
var token_1 = require("./token");
var buildOptions = function (options) {
    options.authorizationURL = options.authorizationURL || 'https://appleid.apple.com/auth/authorize';
    options.tokenURL = options.tokenURL || 'https://appleid.apple.com/auth/token';
    options.scopeSeparator = options.scopeSeparator || ' ';
    options.scope = options.scope || [];
    options.clientSecret = new token_1.AppleClientSecret(options).generate();
    options.customHeaders = options.customHeaders || {};
    return options;
};
exports.buildOptions = buildOptions;
function Strategy(options, verify) {
    var self = this;
    passport_oauth2_1.default.Strategy.call(this, exports.buildOptions(options), verify);
    self.name = 'apple';
}
util_1.inherits(Strategy, passport_oauth2_1.default);
Strategy.prototype.authenticate = function (req, options) {
    var self = this;
    options = options || {};
    if (req.query && req.query.error) {
        if (req.query.error === 'access_denied') {
            return self.fail({ message: req.query.error_description });
        }
        else {
            return self.error(new passport_oauth2_1.default.AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri));
        }
    }
    var callbackURL = options.callbackURL || self._callbackURL;
    if (callbackURL) {
        var parsed = url.parse(callbackURL);
        if (!parsed.protocol) {
            // The callback URL is relative, resolve a fully qualified URL from the
            // URL of the originating request.
            callbackURL = url.resolve(utils.originalURL(req, { proxy: self._trustProxy }), callbackURL);
        }
    }
    if (req.query && req.query.code) {
        var code = req.query.code;
        if (self._state) {
            if (!req.session) {
                return self.error(new Error('AppleStrategy requires session support when using state. Did you forget app.use(express.session(...))?'));
            }
            var key = self._key;
            if (!req.session[key]) {
                return self.fail({ message: 'Unable to verify authorization request state.' }, 403);
            }
            var state = req.session[key].state;
            if (!state) {
                return self.fail({ message: 'Unable to verify authorization request state.' }, 403);
            }
            delete req.session[key].state;
            if (Object.keys(req.session[key]).length === 0) {
                delete req.session[key];
            }
            if (state !== req.query.state) {
                return self.fail({ message: 'Invalid authorization request state.' }, 403);
            }
        }
        var params = self.tokenParams(options);
        params.grant_type = 'authorization_code';
        params.redirect_uri = callbackURL;
        self._oauth2.getOAuthAccessToken(code, params, function (err, accessToken, refreshToken, params) {
            if (err) {
                return self.error(self._createOAuthError('Failed to obtain access token', err));
            }
            self._loadUserProfile(params, function (err, profile) {
                if (err) {
                    return self.error(err);
                }
                function verified(err, user, info) {
                    if (err) {
                        return self.error(err);
                    }
                    if (!user) {
                        return self.fail(info);
                    }
                    self.success(user, info);
                }
                try {
                    if (self._passReqToCallback) {
                        var arity = self._verify.length;
                        if (arity === 6) {
                            self._verify(req, accessToken, refreshToken, params, profile, verified);
                        }
                        else { // arity == 5
                            self._verify(req, accessToken, refreshToken, profile, verified);
                        }
                    }
                    else {
                        var arity = self._verify.length;
                        if (arity === 5) {
                            self._verify(accessToken, refreshToken, params, profile, verified);
                        }
                        else { // arity == 4
                            self._verify(accessToken, refreshToken, profile, verified);
                        }
                    }
                }
                catch (ex) {
                    return self.error(ex);
                }
            });
        });
    }
    else {
        var params = self.authorizationParams(options);
        params.response_type = 'code';
        params.redirect_uri = callbackURL;
        var scope = options.scope || self._scope;
        if (scope) {
            if (Array.isArray(scope)) {
                scope = scope.join(self._scopeSeparator);
            }
            params.scope = scope;
        }
        var state = options.state;
        if (state) {
            params.state = state;
        }
        else if (self._state) {
            if (!req.session) {
                return self.error(new Error('AppleStrategy requires session support when using state. Did you forget app.use(express.session(...))?'));
            }
            var key = self._key;
            state = uid_1.uid(24);
            if (!req.session[key]) {
                req.session[key] = {};
            }
            req.session[key].state = state;
            params.state = state;
        }
        var location_1 = self._oauth2.getAuthorizeUrl(params);
        self.redirect(location_1);
    }
};
Strategy.prototype.tokenParams = function (options) {
    return options;
};
Strategy.prototype._loadUserProfile = function (params, done) {
    var self = this;
    function loadIt() {
        return self.userProfile(params, done);
    }
    function skipIt() {
        return done(null);
    }
    if (typeof self._skipUserProfile === 'function' && self._skipUserProfile.length > 1) {
        // async
        self._skipUserProfile(params, function (err, skip) {
            if (err) {
                return done(err);
            }
            if (!skip) {
                return loadIt();
            }
            return skipIt();
        });
    }
    else {
        var skip = (typeof self._skipUserProfile === 'function') ? self._skipUserProfile() : self._skipUserProfile;
        if (!skip) {
            return loadIt();
        }
        return skipIt();
    }
};
Strategy.prototype.userProfile = function (params, done) {
    try {
        var jwt = require('jsonwebtoken');
        var idToken = params.id_token;
        var decodeIdToken = jwt.decode(idToken);
        var profile = {
            provider: 'apple',
            id: decodeIdToken.sub,
        };
        done(null, profile);
    }
    catch (error) {
        done(error);
    }
};
exports.default = Strategy;
