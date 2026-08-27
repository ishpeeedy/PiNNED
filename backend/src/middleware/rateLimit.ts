import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * Rate limits for the three endpoints where abuse has a real cost.
 *
 * Limits are deliberately generous — they exist to stop scripted abuse, not to
 * inconvenience anyone using the app normally.
 *
 * Note these are per-process and in-memory. On a single instance that is
 * exactly right; if the backend is ever scaled out, they become per-instance
 * and would need a shared store.
 */

const RATE_LIMITED = {
    message: 'Too many requests, please slow down',
};

/** Keyed by user when authenticated, so one bad network cannot lock out a shared IP. */
function keyByUserOrIp(req: Request): string {
    return req.user?.userId ?? req.ip ?? 'unknown';
}

/**
 * Login and registration. Unauthenticated and guessable, so this is the one
 * that matters for credential stuffing — keyed strictly by IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMITED,
    // Only failed attempts count, so a legitimate user signing in repeatedly
    // across devices is unaffected.
    skipSuccessfulRequests: true,
});

/** Each upload costs Cloudinary storage and bandwidth. */
export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMITED,
    keyGenerator: keyByUserOrIp,
});

/** Each call makes the server perform an outbound request on the caller's behalf. */
export const metadataLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: RATE_LIMITED,
    keyGenerator: keyByUserOrIp,
});
