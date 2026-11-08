import { test } from 'node:test';
import assert from 'node:assert/strict';
import { streetView, altitudeFor } from '../server/geo.js';

const fakeFetch = (body) => async () => ({ ok: true, json: async () => body });

test('ohne Google-Key: Link zu Google Maps', async () => {
  const r = await streetView({ lat: 40.7, lng: -74, name: 'NY' }, {});
  assert.equal(r.mode, 'link');
  assert.match(r.external, /viewpoint=40\.7,-74/);
});

test('mit Key: eingebettetes Panorama am nächsten Street-View-Punkt', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeFetch({ status: 'OK', pano_id: 'abc123', location: { lat: 40.71, lng: -74.01 } }));
  const r = await streetView({ lat: 40.7, lng: -74, name: 'NY' }, { GOOGLE_MAPS_API_KEY: 'KEY' });
  assert.equal(r.mode, 'embed');
  assert.match(r.url, /^https:\/\/www\.google\.com\/maps\/embed\/v1\/streetview\?key=KEY&pano=abc123/);
  assert.equal(r.lat, 40.71);
});

test('mit Key, aber kein Street View in der Nähe', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeFetch({ status: 'ZERO_RESULTS' }));
  const r = await streetView({ lat: 0, lng: -140, name: 'Pazifik' }, { GOOGLE_MAPS_API_KEY: 'KEY' });
  assert.equal(r.ok, false);
  assert.match(r.note, /kein Street View/);
});

test('Metadaten-API nicht freigeschaltet: trotzdem einbetten', async (t) => {
  t.mock.method(globalThis, 'fetch', fakeFetch({ status: 'REQUEST_DENIED' }));
  const r = await streetView({ lat: 48.85, lng: 2.29, name: 'Paris' }, { GOOGLE_MAPS_API_KEY: 'KEY' });
  assert.equal(r.mode, 'embed');
  assert.match(r.url, /location=48\.85,2\.29/);
});

test('Zoomhöhe passt zur Größe des Ortes', () => {
  assert.ok(altitudeFor(['40.4', '40.9', '-74.3', '-73.7']) < 0.6);   // Stadt
  assert.ok(altitudeFor(['47', '55', '5', '15']) >= 1.0);              // Deutschland
  assert.ok(altitudeFor(['-35', '37', '-18', '52']) > 1.5);            // Afrika
});
