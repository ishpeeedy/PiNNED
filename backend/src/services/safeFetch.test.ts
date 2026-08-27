import { describe, it, expect } from 'vitest';
import { BlockedUrlError, assertPublicUrl, isPrivateIp } from './safeFetch.ts';

describe('isPrivateIp', () => {
    it.each([
        '127.0.0.1',
        '127.1.2.3',
        '10.0.0.1',
        '10.255.255.255',
        '172.16.0.1',
        '172.31.255.255',
        '192.168.1.1',
        '0.0.0.0',
        '100.64.0.1',
        '198.18.0.1',
        '224.0.0.1',
        '240.0.0.1',
        // The one that matters most: cloud instance metadata.
        '169.254.169.254',
    ])('blocks %s', (ip) => {
        expect(isPrivateIp(ip)).toBe(true);
    });

    it.each([
        '8.8.8.8',
        '1.1.1.1',
        '93.184.216.34',
        '172.15.255.255', // just below the private range
        '172.32.0.0', // just above it
        '11.0.0.1',
        '126.255.255.255',
        '128.0.0.1',
    ])('allows %s', (ip) => {
        expect(isPrivateIp(ip)).toBe(false);
    });

    it.each([
        '::1',
        '::',
        'fc00::1',
        'fd12:3456::1',
        'fe80::1',
        'ff02::1',
        // IPv4-mapped forms must not be a bypass.
        '::ffff:127.0.0.1',
        '::ffff:169.254.169.254',
        '::ffff:10.0.0.1',
    ])('blocks IPv6 %s', (ip) => {
        expect(isPrivateIp(ip)).toBe(true);
    });

    it.each(['2001:4860:4860::8888', '2606:4700:4700::1111'])(
        'allows public IPv6 %s',
        (ip) => {
            expect(isPrivateIp(ip)).toBe(false);
        }
    );

    it('refuses anything that is not an IP', () => {
        expect(isPrivateIp('not-an-ip')).toBe(true);
        expect(isPrivateIp('')).toBe(true);
    });
});

describe('assertPublicUrl', () => {
    it('rejects non-http protocols', async () => {
        for (const url of [
            'file:///etc/passwd',
            'ftp://example.com',
            'gopher://example.com',
            'data:text/plain,hi',
        ]) {
            await expect(assertPublicUrl(new URL(url))).rejects.toThrow(
                BlockedUrlError
            );
        }
    });

    it('rejects literal private addresses without touching DNS', async () => {
        for (const url of [
            'http://127.0.0.1/',
            'http://169.254.169.254/latest/meta-data/',
            'http://10.0.0.5:8080/',
            'http://192.168.1.1/',
            'http://[::1]/',
        ]) {
            await expect(assertPublicUrl(new URL(url))).rejects.toThrow(
                BlockedUrlError
            );
        }
    });

    it('rejects hostnames that resolve to loopback', async () => {
        await expect(
            assertPublicUrl(new URL('http://localhost:5000/'))
        ).rejects.toThrow(BlockedUrlError);
    });

    it('rejects a host that cannot be resolved', async () => {
        await expect(
            assertPublicUrl(
                new URL('http://this-host-does-not-exist.invalid/')
            )
        ).rejects.toThrow(BlockedUrlError);
    });

    it('allows a public literal address', async () => {
        await expect(
            assertPublicUrl(new URL('https://1.1.1.1/'))
        ).resolves.toBeUndefined();
    });
});
