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

**Live on https://passport-apple.ananay.dev**

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
const AppleStrategy = require('passport-apple');
passport.use(new AppleStrategy({
    clientID: "",
    teamID: "",
    callbackURL: "",
    keyID: "",
    privateKeyLocation: "",
    passReqToCallback: true
}, function(req, accessToken, refreshToken, idToken, profile, cb) {
    // The idToken returned is encoded. You can use the jsonwebtoken library via jwt.decode(idToken)
    // to access the properties of the decoded idToken properties which contains the user's
    // identity information.
    // Here, check if the idToken.sub exists in your database!
    // idToken should contains email too if user authorized it but will not contain the name
    // `profile` parameter is REQUIRED for the sake of passport implementation
    // it should be profile in the future but apple hasn't implemented passing data
    // in access token yet https://developer.apple.com/documentation/sign_in_with_apple/tokenresponse
    cb(null, idToken);
}));
```
Add the login route:
```js
app.get("/login", passport.authenticate('apple'));
```

Finally, add the callback route and handle the response:
```js
app.post("/auth", function(req, res, next) {
	passport.authenticate('apple', function(err, user, info) {
		if (err) {
			if (err == "AuthorizationError") {
				res.send("Oops! Looks like you didn't allow the app to proceed. Please sign in again! <br /> \
				<a href=\"/login\">Sign in with Apple</a>");
			} else if (err == "TokenError") {
				res.send("Oops! Couldn't get a valid token from Apple's servers! <br /> \
				<a href=\"/login\">Sign in with Apple</a>");
			} else {
				res.send(err);
			}
		} else {
			if (req.body.user) {
				// Get the profile info (name and email) if the person is registering
				res.json({
					user: req.body.user,
					idToken: user
				});
			} else {
				res.json(user);
			}			
		}
	})(req, res, next);
});
```

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
