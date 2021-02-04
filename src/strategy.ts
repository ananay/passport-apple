import {inherits} from 'util'
import PassportOAuth2 from 'passport-oauth2'
import {
    StrategyOptions,
    Profile,
    VerifyFunction,
    VerifyFunctionWithRequest, StrategyOptionsWithRequest
} from './types'
import * as url from 'url'

const utils = require('./utils')
import {uid} from 'uid'
import {AppleClientSecret} from './token'

export const buildOptions = (options: StrategyOptions | StrategyOptionsWithRequest) => {
    options.authorizationURL = options.authorizationURL || 'https://appleid.apple.com/auth/authorize'
    options.tokenURL = options.tokenURL || 'https://appleid.apple.com/auth/token'
    options.scopeSeparator = options.scopeSeparator || ' '
    options.scope = options.scope || []
    options.clientSecret = new AppleClientSecret(options).generate()
    options.customHeaders = options.customHeaders || {}

    return options
}

function Strategy(options: StrategyOptions | StrategyOptionsWithRequest, verify: VerifyFunction | VerifyFunctionWithRequest) {
    const self = this
    PassportOAuth2.Strategy.call(this, buildOptions(options), verify)
    self.name = 'apple'
}

inherits(Strategy, PassportOAuth2)

Strategy.prototype.authenticate = function (req, options) {

    const self = this
    options = options || {}
    if (req.query && req.query.error) {
        if (req.query.error === 'access_denied') {
            return self.fail({message: req.query.error_description})
        } else {
            return self.error(new PassportOAuth2.AuthorizationError(req.query.error_description, req.query.error, req.query.error_uri))
        }
    }

    let callbackURL = options.callbackURL || self._callbackURL
    if (callbackURL) {
        const parsed = url.parse(callbackURL)
        if (!parsed.protocol) {
            // The callback URL is relative, resolve a fully qualified URL from the
            // URL of the originating request.
            callbackURL = url.resolve(utils.originalURL(req, {proxy: self._trustProxy}), callbackURL)
        }
    }

    if (req.query && req.query.code) {
        const code = req.query.code

        if (self._state) {
            if (!req.session) {
                return self.error(new Error('AppleStrategy requires session support when using state. Did you forget app.use(express.session(...))?'))
            }

            const key = self._key
            if (!req.session[key]) {
                return self.fail({message: 'Unable to verify authorization request state.'}, 403)
            }
            const state = req.session[key].state
            if (!state) {
                return self.fail({message: 'Unable to verify authorization request state.'}, 403)
            }

            delete req.session[key].state
            if (Object.keys(req.session[key]).length === 0) {
                delete req.session[key]
            }

            if (state !== req.query.state) {
                return self.fail({message: 'Invalid authorization request state.'}, 403)
            }
        }

        const params = self.tokenParams(options)

        params.grant_type = 'authorization_code'
        params.redirect_uri = callbackURL

        self._oauth2.getOAuthAccessToken(code, params,
            function (err, accessToken, refreshToken, params) {

                if (err) {
                    return self.error(self._createOAuthError('Failed to obtain access token', err))
                }

                self._loadUserProfile(params, function (err, profile) {
                    if (err) {
                        return self.error(err)
                    }

                    function verified(err, user, info) {
                        if (err) {
                            return self.error(err)
                        }
                        if (!user) {
                            return self.fail(info)
                        }
                        self.success(user, info)
                    }

                    try {
                        if (self._passReqToCallback) {
                            const arity = self._verify.length
                            if (arity === 6) {
                                self._verify(req, accessToken, refreshToken, params, profile, verified)
                            } else { // arity == 5
                                self._verify(req, accessToken, refreshToken, profile, verified)
                            }
                        } else {
                            const arity = self._verify.length
                            if (arity === 5) {
                                self._verify(accessToken, refreshToken, params, profile, verified)
                            } else { // arity == 4
                                self._verify(accessToken, refreshToken, profile, verified)
                            }
                        }
                    } catch (ex) {
                        return self.error(ex)
                    }
                })
            }
        )
    } else {

        const params = self.authorizationParams(options)
        params.response_type = 'code'
        params.redirect_uri = callbackURL
        let scope = options.scope || self._scope
        if (scope) {
            if (Array.isArray(scope)) {
                scope = scope.join(self._scopeSeparator)
            }
            params.scope = scope
        }
        let state = options.state
        if (state) {
            params.state = state
        } else if (self._state) {
            if (!req.session) {
                return self.error(new Error('AppleStrategy requires session support when using state. Did you forget app.use(express.session(...))?'))
            }

            const key = self._key
            state = uid(24)
            if (!req.session[key]) {
                req.session[key] = {}
            }
            req.session[key].state = state
            params.state = state
        }
        const location = self._oauth2.getAuthorizeUrl(params)
        self.redirect(location)
    }
}

Strategy.prototype.tokenParams = function (options) {
    return options
}

Strategy.prototype._loadUserProfile = function (params, done) {
    const self = this

    function loadIt() {
        return self.userProfile(params, done)
    }

    function skipIt() {
        return done(null)
    }

    if (typeof self._skipUserProfile === 'function' && self._skipUserProfile.length > 1) {
        // async
        self._skipUserProfile(params, function (err, skip) {
            if (err) {
                return done(err)
            }
            if (!skip) {
                return loadIt()
            }
            return skipIt()
        })
    } else {
        const skip = (typeof self._skipUserProfile === 'function') ? self._skipUserProfile() : self._skipUserProfile
        if (!skip) {
            return loadIt()
        }
        return skipIt()
    }
}

Strategy.prototype.userProfile = function (params, done) {
    try {
        const jwt = require('jsonwebtoken')
        const idToken = params.id_token
        const decodeIdToken = jwt.decode(idToken)
        const profile: Profile = {
            provider: 'apple',
            id: decodeIdToken.sub,
        }
        done(null, profile)
    } catch (error) {
        done(error)
    }
}

export default Strategy
