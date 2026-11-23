// Eve history (fakegato-history) rewrites the whole persist file on every
// addEntry. The status poll runs every 30 s, so logging each poll rewrote a
// ~1.4 MB file every 30 s, forever. Eve's thermostat graph only needs a point
// every 10 minutes plus the moments something actually changed.
const MIN_INTERVAL_SEC = 600

const shouldLogHistory = (last, entry, minIntervalSec = MIN_INTERVAL_SEC) => {
	if (!last)
		return true
	if (entry.valvePosition !== last.valvePosition || entry.setTemp !== last.setTemp)
		return true
	if (Math.abs((entry.currentTemp || 0) - (last.currentTemp || 0)) >= 1)
		return true
	return entry.time - last.time >= minIntervalSec
}

module.exports = { shouldLogHistory, MIN_INTERVAL_SEC }
