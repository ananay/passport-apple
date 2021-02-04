import {StrategyOptions, StrategyOptionsWithRequest} from './types'
import fs from 'fs'
import { TokenError } from 'passport-oauth2'
import * as jwt from 'jsonwebtoken'

export class AppleClientSecret {
    private config: {
        clientID: string
        teamID: string
        privateKey: string
        keyID: string
    }

    constructor(options: StrategyOptions | StrategyOptionsWithRequest) {
        const clientID = options.clientID
        const teamID = options.teamID
        const keyID = options.keyID
        const privateKey = options.privateKeyString ? options.privateKeyString : fs.readFileSync(options.privateKeyLocation).toString()

        if (!clientID) {
            throw new TokenError(`'clientID'가 제공되지 않았습니다`, `'CLIENT ID' NEED`)
        }
        if (!teamID) {
            throw new TokenError(`'teamID'가 제공되지 않았습니다`, `'TEAM ID' NEED`)
        }
        if (!keyID) {
            throw new TokenError(`'keyID'가 제공되지 않았습니다`, `'KEY ID' NEED`)
        }
        if (!privateKey) {
            throw new TokenError(`'privateKey'가 제공되지 않았습니다`, `'PRIVATE KEY' NEED`)
        }
        this.config = {
            clientID,
            teamID,
            keyID,
            privateKey,
        }

        this.generate = this.generate.bind(this)
        this.generateToken = this.generateToken.bind(this)
    }

    /**
     * Generates the JWT token
     * @param {string} clientId
     * @param {string} teamId
     * @param {string} privateKey
     * @param {string} keyId
     * @returns {Promise<string>} token
     */
    generateToken(clientId: string, teamId: string, privateKey: string, keyId: string): string{
        const iat = Math.floor(Date.now() / 1000) // Make it expire within 6 months
        const exp = iat + (86400 * 180) // Make it expire within 6 months
        const claims = {
            iss: teamId,
            iat,
            exp,
            aud: 'https://appleid.apple.com',
            sub: clientId,
            nonce: `nonce-${Date.now()}`
        }
        return jwt.sign(claims, privateKey, {
            algorithm: 'ES256',
            keyid: keyId
        },)
    }

    /**
     * Reads the private key file calls
     * the token generation method
     * @returns {Promise<string>} token - The generated client secret
     */
    generate(): string {
        return this.generateToken(
            this.config.clientID,
            this.config.teamID,
            this.config.privateKey,
            this.config.keyID,
        )
    }
}
