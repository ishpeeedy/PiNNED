import dns from 'node:dns/promises';
import net from 'node:net';

/**
 * SSRF protection for the metadata scraper.
 *
 * /api/metadata fetches a URL the user supplies. Without a guard, any signed-up
 * account can make the server request internal addresses a browser could never
 * reach — other services on the private network, or the cloud provider's
 * instance metadata endpoint at 169.254.169.254, which commonly hands out
 * credentials.
 *
 * Following redirects made it worse: a perfectly public URL could 302 straight
 * to an internal one. Redirects are therefore followed manually, revalidating
 * every hop.
 */

export class BlockedUrlError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BlockedUrlError';
    }
}

const MAX_REDIRECTS = 5;

function ipv4ToInt(ip: string): number {
    return (
        ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>>
        0
    );
}

function inCidr(ip: string, base: string, bits: number): boolean {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (ipv4ToInt(ip) & mask) === (ipv4ToInt(base) & mask);
}

const BLOCKED_V4: [string, number][] = [
    ['0.0.0.0', 8], // "this" network
    ['10.0.0.0', 8], // private
    ['100.64.0.0', 10], // carrier-grade NAT
    ['127.0.0.0', 8], // loopback
    ['169.254.0.0', 16], // link-local — cloud instance metadata lives here
    ['172.16.0.0', 12], // private
    ['192.0.0.0', 24], // IETF protocol assignments
    ['192.0.2.0', 24], // documentation
    ['192.168.0.0', 16], // private
    ['198.18.0.0', 15], // benchmarking
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved
];

export function isPrivateIp(ip: string): boolean {
    const version = net.isIP(ip);
    if (version === 0) return true; // not an IP at all — refuse to guess

    if (version === 4) {
        return BLOCKED_V4.some(([base, bits]) => inCidr(ip, base, bits));
    }

    const normalized = ip.toLowerCase().split('%')[0];

    // IPv4-mapped (::ffff:127.0.0.1) and IPv4-compatible forms.
    const mapped = normalized.match(/^::(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateIp(mapped[1]);

    if (normalized === '::1' || normalized === '::') return true;

    const head = normalized.split(':')[0];
    const leading = parseInt(head || '0', 16);
    if (Number.isNaN(leading)) return true;

    if ((leading & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
    if ((leading & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
    if ((leading & 0xff00) === 0xff00) return true; // ff00::/8 multicast

    return false;
}

/**
 * Throws unless the URL is http(s) and every address its host resolves to is
 * publicly routable.
 *
 * Note: there is an unavoidable gap between resolving here and connecting in
 * fetch (DNS rebinding). Closing it fully requires pinning the resolved
 * address at the socket layer; this blocks every straightforward case.
 */
export async function assertPublicUrl(url: URL): Promise<void> {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new BlockedUrlError(`Unsupported protocol: ${url.protocol}`);
    }

    const host = url.hostname.replace(/^\[|\]$/g, '');

    if (net.isIP(host)) {
        if (isPrivateIp(host)) {
            throw new BlockedUrlError('URL resolves to a private address');
        }
        return;
    }

    let addresses: string[];
    try {
        const records = await dns.lookup(host, { all: true });
        addresses = records.map((record) => record.address);
    } catch {
        throw new BlockedUrlError(`Could not resolve host: ${host}`);
    }

    if (addresses.length === 0) {
        throw new BlockedUrlError(`Could not resolve host: ${host}`);
    }
    // Every address must be safe — a host resolving to both a public and a
    // private address must not be reachable.
    if (addresses.some(isPrivateIp)) {
        throw new BlockedUrlError('URL resolves to a private address');
    }
}

function isRedirect(status: number): boolean {
    return (
        status === 301 ||
        status === 302 ||
        status === 303 ||
        status === 307 ||
        status === 308
    );
}

export interface SafeFetchOptions extends Omit<RequestInit, 'redirect'> {
    timeoutMs?: number;
}

export async function safeFetch(
    input: string,
    options: SafeFetchOptions = {}
): Promise<Response> {
    const { timeoutMs = 10_000, ...init } = options;

    let current: URL;
    try {
        current = new URL(input);
    } catch {
        throw new BlockedUrlError('Invalid URL');
    }

    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
        await assertPublicUrl(current);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        let response: Response;
        try {
            response = await fetch(current, {
                ...init,
                signal: controller.signal,
                redirect: 'manual',
            });
        } finally {
            clearTimeout(timeout);
        }

        if (!isRedirect(response.status)) return response;

        const location = response.headers.get('location');
        if (!location) return response;

        try {
            current = new URL(location, current);
        } catch {
            throw new BlockedUrlError('Invalid redirect target');
        }
    }

    throw new BlockedUrlError('Too many redirects');
}
