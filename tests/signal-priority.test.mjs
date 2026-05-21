import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  SIGNAL_PRIORITIES,
  SIGNAL_PRIORITY_RANK,
  isSignalPriority,
  meetsMinPriority,
} from '../dist/index.js';

describe('SIGNAL_PRIORITIES — canonical 4-value union', () => {
  it('exports exactly LOW, MEDIUM, HIGH, CRITICAL in ascending rank order', () => {
    assert.deepEqual([...SIGNAL_PRIORITIES], ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  });
});

describe('SIGNAL_PRIORITY_RANK — ordinal map', () => {
  it('assigns LOW=1, MEDIUM=2, HIGH=3, CRITICAL=4', () => {
    assert.equal(SIGNAL_PRIORITY_RANK.LOW, 1);
    assert.equal(SIGNAL_PRIORITY_RANK.MEDIUM, 2);
    assert.equal(SIGNAL_PRIORITY_RANK.HIGH, 3);
    assert.equal(SIGNAL_PRIORITY_RANK.CRITICAL, 4);
  });
});

describe('isSignalPriority — runtime type guard', () => {
  it('accepts canonical 4 values', () => {
    assert.equal(isSignalPriority('LOW'), true);
    assert.equal(isSignalPriority('MEDIUM'), true);
    assert.equal(isSignalPriority('HIGH'), true);
    assert.equal(isSignalPriority('CRITICAL'), true);
  });
  it('rejects URGENT (Task-namespace, distinct vocabulary)', () => {
    assert.equal(isSignalPriority('URGENT'), false);
  });
  it('rejects NORMAL (spoke-boundary form, pre-normalization)', () => {
    assert.equal(isSignalPriority('NORMAL'), false);
  });
  it('rejects lowercase variants (Milo framework-tones namespace)', () => {
    assert.equal(isSignalPriority('high'), false);
    assert.equal(isSignalPriority('low'), false);
  });
  it('rejects non-string inputs', () => {
    assert.equal(isSignalPriority(3), false);
    assert.equal(isSignalPriority(null), false);
    assert.equal(isSignalPriority(undefined), false);
    assert.equal(isSignalPriority({}), false);
  });
});

describe('meetsMinPriority — threshold comparator', () => {
  it('CRITICAL meets every threshold (LOW, MEDIUM, HIGH, CRITICAL)', () => {
    assert.equal(meetsMinPriority('CRITICAL', 'LOW'), true);
    assert.equal(meetsMinPriority('CRITICAL', 'MEDIUM'), true);
    assert.equal(meetsMinPriority('CRITICAL', 'HIGH'), true);
    assert.equal(meetsMinPriority('CRITICAL', 'CRITICAL'), true);
  });
  it('HIGH meets LOW + MEDIUM + HIGH; fails CRITICAL', () => {
    assert.equal(meetsMinPriority('HIGH', 'LOW'), true);
    assert.equal(meetsMinPriority('HIGH', 'MEDIUM'), true);
    assert.equal(meetsMinPriority('HIGH', 'HIGH'), true);
    assert.equal(meetsMinPriority('HIGH', 'CRITICAL'), false);
  });
  it('MEDIUM meets LOW + MEDIUM; fails HIGH + CRITICAL', () => {
    assert.equal(meetsMinPriority('MEDIUM', 'LOW'), true);
    assert.equal(meetsMinPriority('MEDIUM', 'MEDIUM'), true);
    assert.equal(meetsMinPriority('MEDIUM', 'HIGH'), false);
    assert.equal(meetsMinPriority('MEDIUM', 'CRITICAL'), false);
  });
  it('LOW meets only LOW threshold', () => {
    assert.equal(meetsMinPriority('LOW', 'LOW'), true);
    assert.equal(meetsMinPriority('LOW', 'MEDIUM'), false);
    assert.equal(meetsMinPriority('LOW', 'HIGH'), false);
    assert.equal(meetsMinPriority('LOW', 'CRITICAL'), false);
  });
});

describe('Real-world precedence-authority example coverage (spec lines 727-729)', () => {
  it('harvest-home.appraisal_concern (CRITICAL) passes HIGH threshold', () => {
    assert.equal(meetsMinPriority('CRITICAL', 'HIGH'), true);
  });
  it('homestretch.stall_detected (HIGH) blocked by CRITICAL threshold', () => {
    assert.equal(meetsMinPriority('HIGH', 'CRITICAL'), false);
  });
});
