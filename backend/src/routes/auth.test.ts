import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import User from '../models/user.ts';
import { startTestServer, stopTestServer } from '../test/harness.ts';

let app: Express;

beforeAll(async () => {
    app = await startTestServer();
}, 120_000);

afterAll(async () => {
    await stopTestServer();
});

describe('auth', () => {
    it('registers a user and logs them in', async () => {
        const credentials = {
            email: 'someone@example.com',
            password: 'correct horse battery staple',
            name: 'Someone',
        };

        const registered = await request(app)
            .post('/api/auth/register')
            .send(credentials)
            .expect(201);
        expect(registered.body.token).toBeTruthy();

        const loggedIn = await request(app)
            .post('/api/auth/login')
            .send({
                email: credentials.email,
                password: credentials.password,
            })
            .expect(200);
        expect(loggedIn.body.token).toBeTruthy();

        // The hash must never leave the server.
        expect(loggedIn.body.user.password).toBeUndefined();
        const stored = await User.findOne({ email: credentials.email });
        expect(stored!.password).not.toBe(credentials.password);
    });

    it('rejects a wrong password', async () => {
        await request(app)
            .post('/api/auth/login')
            .send({ email: 'someone@example.com', password: 'wrong' })
            .expect(401);
    });

    // The limiter counts only failed attempts, so this is the credential
    // stuffing path. Previously unbounded.
    it('rate limits repeated failed logins', async () => {
        let sawTooManyRequests = false;

        for (let attempt = 0; attempt < 40; attempt++) {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'someone@example.com',
                    password: `guess-${attempt}`,
                });

            if (response.status === 429) {
                sawTooManyRequests = true;
                break;
            }
            expect(response.status).toBe(401);
        }

        expect(sawTooManyRequests).toBe(true);
    });
});
