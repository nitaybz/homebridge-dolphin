const { test } = require('node:test')
const assert = require('node:assert')
const { shouldLogHistory } = require('../homekit/historyThrottle')

const base = { time: 1000, currentTemp: 40, setTemp: 50, valvePosition: 0 }

test('first entry is always logged', () => {
	assert.strictEqual(shouldLogHistory(null, base), true)
})

test('an unchanged poll 30 s later is skipped', () => {
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1030 }), false)
})

test('an unchanged poll is logged again after 10 minutes', () => {
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1600 }), true)
})

test('heating on/off or a new target is logged at once', () => {
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1030, valvePosition: 100 }), true)
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1030, setTemp: 55 }), true)
})

test('a water temperature move of a full degree is logged at once, less is not', () => {
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1030, currentTemp: 41 }), true)
	assert.strictEqual(shouldLogHistory(base, { ...base, time: 1030, currentTemp: 40.5 }), false)
})
