/**
 * Passport Strategy that implements "Sign in with Apple"
 * @author: Ananay Arora <i@ananayarora.com>
 */

const OAuth2Strategy = require('passport-oauth2'),
    crypto = require('crypto'),
    AppleClientSecret = require("./token"),
    util = require('util'),
    querystring = require('querystring');

/**
 * Passport Strategy Constructor
 *
 * Example:
 *
 *   passport.use(new AppleStrategy({
 *      clientID: "",
 *      teamID: "",
 *      callbackURL: "",
 *      keyID: "",
 *      privateKeyLocation: "",
 *      passReqToCallback: true
 *   }, function(req, accessToken, refreshToken, idToken, __ , cb) {
 *       // The idToken returned is encoded. You can use the jsonwebtoken library via jwt.decode(idToken)
 *       // to access the properties of the decoded idToken properties which contains the user's
 *       // identity information.
 *       // Here, check if the idToken.sub exists in your database!
 *       // __ parameter is REQUIRED for the sake of passport implementation
 *       // it should be profile in the future but apple hasn't implemented passing data
 *       // in access token yet https://developer.apple.com/documentation/sign_in_with_apple/tokenresponse
 *       cb(null, idToken);
 *   }));
 *
 * @param {object} options - Configuration options
 * @param {string} options.clientID – Client ID (also known as the Services ID
 *  in Apple's Developer Portal). Example: com.ananayarora.app
 * @param {string} options.teamID – Team ID for the Apple Developer Account
 *  found on top right corner of the developers page
 * @param {string} options.keyID – The identifier for the private key on the Apple
 *  Developer Account page
 * @param {string} options.callbackURL – The OAuth Redirect URI
 * @param {string} options.privateKeyLocation - Location to the private key
 * @param {string} options.privateKeyString - Private key string
 * @param {boolean} options.passReqToCallback - Determine if the req will be passed to passport cb function
 * @param {function} verify
 * @access public
 */
function Strategy(options, verify) {
    // Set the URLs
    options = options || {};
    options.authorizationURL = options.authorizationURL || 'https://appleid.apple.com/auth/authorize';
    options.tokenURL = options.tokenURL || 'https://appleid.apple.com/auth/token';
    options.passReqToCallback = options.passReqToCallback === undefined ? true : options.passReqToCallback

    // Make the OAuth call
    OAuth2Strategy.call(this, options, verify);
    this.name = 'apple';

    // Initiliaze the client_secret generator
    const _tokenGenerator = new AppleClientSecret({
        "client_id": options.clientID,
        "team_id": options.teamID,
        "key_id": options.keyID
    }, options.privateKeyLocation, options.privateKeyString);

    // Get the OAuth Access Token from Apple's server
    // using the grant code / refresh token.

    this._oauth2.getOAuthAccessToken = function(code, params, callback) {
        // Generate the client_secret using the library
        _tokenGenerator.generate().then((client_secret) => {
            params = params || {};
            const codeParam = params.grant_type === 'refresh_token' ? 'refresh_token' : 'code';
            params[codeParam] = code;
            params['client_id'] = this._clientId;
            params['client_secret'] = client_secret;

            const post_data = querystring.stringify(params);
            const post_headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            this._request(
                'POST',
                this._getAccessTokenUrl(),
                post_headers,
                post_data,
                null,
                function(error, data, response) {
                    if (error) {
                        callback(error);
                    } else {
                        const results = JSON.parse(data);
                        const access_token = results.access_token;
                        const refresh_token = results.refresh_token;
                        callback(null, access_token, refresh_token, results.id_token);
                    }
                }
            )
        }).catch((error) => {
            callback(error);
        });
    }
}

// Inherit from `OAuth2Strategy`.
util.inherits(Strategy, OAuth2Strategy);

/**
 * Process the authentication request
 * @param {http.IncomingMessage} req
 * @param {object} options
 * @access protected
 */
Strategy.prototype.authenticate = function (req, options) {
    // Workaround instead of reimplementing authenticate function
    req.query = { ...req.query, ...req.body };
    if(req.body && req.body.user){
      req.appleProfile = JSON.parse(req.body.user)
    }
    OAuth2Strategy.prototype.authenticate.call(this, req, options);
  };

/**
 * Modify the authorization params. Currently adds
 * the missing `state` parameter
 * @param {object} options
 * @access protected
 */
Strategy.prototype.authorizationParams = function (options) {
    options.state = options.state || crypto.randomBytes(5).toString('hex');
    options.response_type = "code id_token";
    options.scope = "name email";
    options.response_mode = "form_post";
    return options;
}

// Expose Strategy.
exports = module.exports = Strategy;

// Exports.
exports.Strategy = Strategy;
