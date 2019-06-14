#  Sign in with Apple for Passport.js

<a href="https://twitter.com/intent/follow?screen_name=ananayarora"><img src="https://img.shields.io/twitter/follow/ananayarora.svg?label=Follow%20@ananayarora" alt="Follow @ananayarora"></img></a>

Passport strategy for the new Sign in with Apple feature!

## Installation
Install the package via npm / yarn:
``` npm install --save passport-apple ```

Next, you need to configure your Apple Developer Account with Sign in with Apple.

Steps for that are given here:
https://github.com/ananay/apple-auth/blob/master/SETUP.md

## Usage
```
const AppleStrategy = require('passport-apple');
passport.use(new AppleStrategy({
    clientID: "",
    teamID: "",
    callbackURL: "",
    keyID: "",
    privateKeyLocation: ""
}, function(accessToken, refreshToken, idToken, profile, cb) {
    // Here, check if the idToken exists in your database!
    cb(null, idToken);
}));
```

## Other Sign in with Apple repos

Check out my other sign in with Apple Repos here. More coming soon!

```apple-auth```:

<a href="https://github.com/ananay/apple-auth">https://github.com/ananay/apple-auth</a><br />
<a href="https://npmjs.com/package/apple-auth">https://npmjs.com/package/apple-auth</a>


## Questions / Contributing

Feel free to open issues and pull requests. If you would like to be one of the core creators of this library, please reach out to me at i@ananayarora.com or message me on twitter @ananayarora!

<h4> Created with ❤️ by <a href="https://ananayarora.com">Ananay Arora</a></h4>
