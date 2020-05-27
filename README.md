#  Sign in with Apple for Passport.js

<a href="https://twitter.com/intent/follow?screen_name=ananayarora"><img src="https://img.shields.io/twitter/follow/ananayarora.svg?label=Follow%20@ananayarora" alt="Follow @ananayarora"></img></a>
<a href="https://npmjs.com/package/passport-apple">
  <img src="https://img.shields.io/npm/dt/passport-apple.svg"></img>
  <img src="https://img.shields.io/npm/v/passport-apple.svg"></img>
</a>
</p>

Passport strategy for the new Sign in with Apple feature!

## Installation
Install the package via npm / yarn:
``` npm install --save passport-apple ```

Next, you need to configure your Apple Developer Account with Sign in with Apple.

Steps for that are given here:
https://github.com/ananay/apple-auth/blob/master/SETUP.md


## Example

**Live on https://passport-apple.ananay.dev**

Example repo: https://github.com/ananay/passport-apple-example


## Usage

Initialize the strategy as follows:

```
const AppleStrategy = require('passport-apple');
passport.use(new AppleStrategy({
    clientID: "",
    teamID: "",
    callbackURL: "",
    keyID: "",
    privateKeyLocation: "",
    passReqToCallback: true
}, function(req, accessToken, refreshToken, decodedIdToken, __ , cb) {
    // Here, check if the decodedIdToken.sub exists in your database!
    // decodedIdToken should contains email too if user authorized it but will not contain the name
    // __ parameter is REQUIRED for the sake of passport implementation
    // it should be profile in the future but apple hasn't implemented passing data 
    // in access token yet https://developer.apple.com/documentation/sign_in_with_apple/tokenresponse
    cb(null, idToken);
}));
```
Add the login route:
```app.get("/login", passport.authenticate('apple'));```

Finally, add the callback route and handle the response:
```
app.get("/auth", function(req, res, next) {
    passport.authenticate('apple', function(err, user, info) {
        if (err) {
            if (err == "AuthorizationError") {
                res.send("Oops! Looks like you didn't allow the app to proceed. Please sign in again! <br /> \
                <a href=\"/login\">Sign in with Apple</a>");
            } else if (err == "TokenError") {
                res.send("Oops! Couldn't get a valid token from Apple's servers! <br /> \
                <a href=\"/login\">Sign in with Apple</a>");
            }
        } else {
            res.send("Unique user ID: - " + user);
        }
    })(req, res, next);
});
```

## Other Sign in with Apple repos

Check out my other sign in with Apple Repos here. More coming soon!

```apple-auth```:

<a href="https://github.com/ananay/apple-auth">https://github.com/ananay/apple-auth</a><br />
<a href="https://npmjs.com/package/apple-auth">https://npmjs.com/package/apple-auth</a>


## Questions / Contributing

Feel free to open issues and pull requests. If you would like to be one of the core creators of this library, please reach out to me at i@ananayarora.com or message me on twitter @ananayarora!

<h4> Created with ❤️ by <a href="https://ananayarora.com">Ananay Arora</a></h4>
