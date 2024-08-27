#  Sign in with Apple for Passport.js

<a href="https://twitter.com/intent/follow?screen_name=ananayarora"><img src="https://img.shields.io/twitter/follow/ananayarora.svg?label=Follow%20@ananayarora" alt="Follow @ananayarora"></img></a>
<a href="https://npmjs.com/package/passport-apple">
  <img src="https://img.shields.io/npm/dt/passport-apple.svg"></img>
  <img src="https://img.shields.io/npm/v/passport-apple.svg"></img>
</a>
</p>

Passport strategy for the new Sign in with Apple feature, now with fetching profile information ✅!

⚠️ Important note: Apple will only provide you with the name ONCE which is when the user taps "Sign in with Apple" on your app the first time. Keep in mind that you have to store this in your database at this time! For every login after that, Apple will provide you with a unique ID and the email that you can use to lookup the username in your database.

## Example

**Example repo: https://github.com/ananay/passport-apple-example**

## Installation
Install the package via npm / yarn:
``` npm install --save passport-apple ```

You will also need to install & configure `body-parser` if using Express:
``` npm install --save body-parser ```

```js
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
```

Next, you need to configure your Apple Developer Account with Sign in with Apple.

Steps for that are given here:
https://github.com/ananay/apple-auth/blob/master/SETUP.md

## Usage

Initialize the strategy as follows:

```js
import AppleStrategy from 'passport-apple';
import jsonwebtoken from 'jsonwebtoken';
import assert from 'node:assert';

passport.use(new AppleStrategy({
  clientID: '',
  teamID: '',
  callbackURL: 'https://redirectmeto.com/http://localhost:8080/auth/apple/callback', // redirectmeto.com is useful for local testing
  keyID: '',
  privateKeyString: '',
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, idToken, profile, cb) => {
  try {
    const decodedToken = jsonwebtoken.decode(idToken, { json: true });
    assert(decodedToken != null);

    // ONLY on the first auth each user makes, `req.query.user` gets set - after that it will no longer be sent in subsequent logins.
    // In that case `req.query.user` is a JSON encoded string, which has the properties `firstName` and `lastName`.
    // Note: If you need to test first auth again, you can remove the app from "Sign in with Apple" here: https://appleid.apple.com/account/manage
    const firstTimeUser = typeof req.query['user'] === 'string' ? JSON.parse(req.query['user']) : undefined;

    // JWT token should contain email if authenticated
    const { sub, email, email_verified } = decodedToken;

    // TODO implement your own function check for whether `sub` exists in your database (or create a new user if it does not)
    const dbUser = await upsertUser({ sub, email, email_verified, firstTimeUser });

    return cb(null, { id: dbUser.id });
  } catch (err) {
    return cb(err);
  }
}));
```

Add the login route:

```js
// This is the initial request that gets the whole process started (and redirects to Apple's server)
app.get('/apple', passport.authenticate('apple'));
```

Finally, add the callback route and handle the response:

```js
// Apple is different in that they POST back to the callback.
// Because of SameSite policies in browsers don't allow cookies to be included in external POST requests
// we wouldn't be able to access our express session here, and thereby not authenticate the session.
// Therefore we redirect the POST request to GET (with query parameters).
// https://github.com/ananay/passport-apple/issues/51#issuecomment-2312651378
app.post('/apple/callback', express.urlencoded({ extended: true }), (req, res) => {
  const { body } = req;
  const sp = new URLSearchParams();
  Object.entries(body).forEach(([key, value]) => sp.set(key, String(value)));
  res.redirect(`/v1/auth/apple/callback?${sp.toString()}`);
});

const failureRedirect = '/failure';

// Here we handle the GET request after the redirect from the POST callback above
app.get('/apple/callback', passport.authenticate('apple', {
  successReturnToOrRedirect: '/success',
  failureRedirect,
}), (err, _req, res, _next) => {
  // for some reason, `failureRedirect` doesn't receive certain errors, so we need an error handler here.
  if (err instanceof Error && (err.name === 'AuthorizationError' || err.name === 'TokenError')) {
    // Common errors:
    // - AuthorizationError { code: 'user_cancelled_authorize' } - When the user cancels the operation
    // - TokenError { code: 'invalid_grant' } - The code has already been used
    const sp = new URLSearchParams({ error: err.name });
    if ('code' in err && typeof err.code === 'string') sp.set('code', err.code);
    res.redirect(`${failureRedirect}${sp.toString()}`);
    return;
  }

  // unknown err object
  res.redirect(failureRedirect);
});
```

## Testing locally

Even though Apple requires HTTPS on your redirect URL, you can work around this by using a service like redirectmeto.com. For example if your local dev server is running on port 8080, add this redirect URL in your Apple developer console:

```
https://redirectmeto.com/http://localhost:8080/auth/apple/callback
```

Note: Remember to remove it again after you're done testing, as it could be a security issue if running with it in production.

## Other Sign in with Apple repos

Check out my other sign in with Apple Repos here.

```apple-auth```:

<a href="https://github.com/ananay/apple-auth">https://github.com/ananay/apple-auth</a><br />
<a href="https://npmjs.com/package/apple-auth">https://npmjs.com/package/apple-auth</a>


## FAQ

#### What's the difference between `apple-auth` and `passport-apple`?
`apple-auth` is a standalone library for Sign in with Apple. It does not require you to use Passport.js where as passport-apple is used with Passport.js.

#### ⚠️ Legal Disclaimer
This repository is NOT developed, endorsed by Apple Inc. or even related at all to Apple Inc. This library was implemented solely by the community's hardwork, and based on information that is public on Apple Developer's website. The library merely acts as a helper tool for anyone trying to implement Apple's Sign in with Apple.

#### How is this module different from [nicokaiser/passport-apple](https://github.com/nicokaiser/passport-apple)?
`@nicokaiser/passport-apple` is a fork of `passport-apple` that was made when `passport-apple` couldn't support fetching profile information. `passport-apple` now **supports** fetching profile information as well by using a simpler workaround (shoutout to [@MotazAbuElnasr](https://github.com/MotazAbuElnasr) for this!) instead of rewriting all of `passport-oauth2`.

## Questions / Contributing

Feel free to open issues and pull requests. If you would like to be one of the core creators of this library, please reach out to me at i@ananayarora.com or message me on twitter @ananayarora!

<h4> Created with ❤️ by <a href="https://ananayarora.com">Ananay Arora</a></h4>
