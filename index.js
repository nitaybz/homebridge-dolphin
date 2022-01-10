const dolphinApi = require('./dolphin/api')
const syncHomeKitCache = require('./dolphin/syncHomeKitCache')
const path = require('path')
const storage = require('node-persist')
const PLUGIN_NAME = 'homebridge-dolphin'
const PLATFORM_NAME = 'Dolphin'

module.exports = (api) => {
	api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, dolphinPlatform)
}

class dolphinPlatform {
	constructor(log, config, api) {

		this.cachedAccessories = []
		this.activeAccessories = []
		this.log = log
		this.api = api
		this.storage = storage
		this.syncHomeKitCache = syncHomeKitCache(this)
		this.name = PLATFORM_NAME
		// this.enableHistoryStorage = config['historyStorage'] || false
		this.debug = config['debug'] || false
		this.PLUGIN_NAME = PLUGIN_NAME
		this.PLATFORM_NAME = PLATFORM_NAME

		
		this.email = config['email']
		this.password = config['password']
		this.devices = config['devices']
		
		if (!this.email || !this.password) {
			this.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX  --  ERROR  --  XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n')
			this.log('Can\'t start homebridge-dolphin plugin without email and password !!\n')
			this.log('XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX\n')
			return
		}

		this.persistPath = path.join(this.api.user.persistPath(), '/../dolphin-persist')
		this.emptyState = {devices:{}}
		// const requestedInterval = config['statePollingInterval'] === 0 ? 0 : (config['statePollingInterval'] || 30) // default polling time is 30 seconds
		// this.refreshDelay = 2000
		
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //

		// this.setProcessing = false
		// this.pollingTimeout = null
		// this.processingState = false
		// this.refreshTimeout = null
		// this.pollingInterval = requestedInterval ? (requestedInterval * 1000 - this.refreshDelay) : false

		// define debug method to output debug logs when enabled in the config
		this.log.easyDebug = (...content) => {
			if (this.debug) {
				this.log(content.reduce((previous, current) => {
					return previous + ' ' + current
				}))
			} else
				this.log.debug(content.reduce((previous, current) => {
					return previous + ' ' + current
				}))
		}
		
		this.api.on('didFinishLaunching', async () => {
			// if (this.pollingInterval)
			// 	this.pollingTimeout = setTimeout(this.refreshState.ac, this.pollingInterval)
			
			
			this.dolphinApi = dolphinApi(this)
			this.syncHomeKitCache()

		})

	}

	configureAccessory(accessory) {
		this.cachedAccessories.push(accessory)
	}

}
