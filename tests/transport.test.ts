import assert from 'node:assert/strict';
import test from 'node:test';
import { estimateRideFare, getTransportOptions, nearestTransit, schedules } from '../server/transport.ts';

test('KLIA2 provides at least two complete transport options', () => {
  const options = getTransportOptions('KLIA2', 'Hotel Damai', 2, 2);
  assert.ok(options.length >= 2);
  for (const option of options) {
    assert.ok(option.duration);
    assert.ok(option.costMin >= 0 && option.costMax >= option.costMin);
    assert.ok(option.steps.length >= 3);
  }
});

test('nearest transit includes station, walk time and line', () => {
  const [station] = nearestTransit();
  assert.equal(station.name, 'Bukit Bintang');
  assert.ok(station.walkMinutes > 0);
  assert.ok(station.lines.includes('Kajang Line'));
});

test('ride fare is clearly not a live price', () => {
  const fare = estimateRideFare(58, true);
  assert.equal(fare.livePrice, false);
  assert.ok(fare.max > fare.min);
});

test('static ferry schedule has official operator link', () => {
  assert.equal(schedules['langkawi-kuala-perlis'].operator, 'Langkawi Ferry Line');
  assert.match(schedules['langkawi-kuala-perlis'].officialUrl, /^https:/);
});
