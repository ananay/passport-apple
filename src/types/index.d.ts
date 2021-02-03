import PassportOAuth2 from 'passport-oauth2'
import Express from 'express'

type _StrategyBaseOptions = {
    clientID?: string,
    clientSecret?: string,
    authorizationURL?: string,
    tokenURL?: string,
    callbackURL?: string,
    nonce?: string
    teamID?: string
    keyID?: string
    privateKeyLocation?: string
    privateKeyString?: string
    customHeaders?: { [key: string]: string }
    scope?: string | string[]
    scopeSeparator?: string
    skipUserProfile?: any
}

export interface StrategyOptions extends _StrategyBaseOptions {
    passReqToCallback?: false
}

export interface StrategyOptionsWithRequest extends _StrategyBaseOptions {
    passReqToCallback: true
}

export interface Profile {
    provider: string
    id: string
}


export type VerifyFunction = PassportOAuth2.VerifyFunction

export type VerifyFunctionWithRequest = PassportOAuth2.VerifyFunctionWithRequest

export class Strategy extends PassportOAuth2.Strategy {
    constructor(options: StrategyOptions, verify: VerifyFunction);
    constructor(options: StrategyOptionsWithRequest, verify: VerifyFunctionWithRequest);

    authorizationParams(options: any): object

    authenticate(req: Express.Request, options?: any): void

    userProfile(param: any, done: (error: any, user?: any) => void): void
}
