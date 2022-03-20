const dolphinApi = require('./dolphin/api')
const syncHomeKitCache = require('./dolphin/syncHomeKitCache')
const path = require('path')
const PLUGIN_NAME = 'homebridge-dolphin'
const PLATFORM_NAME = 'Dolphin'
var fs = require('fs');

module.exports = (api) => {
	api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, dolphinPlatform)
}

class dolphinPlatform {
	constructor(log, config, api) {

		this.cachedAccessories = []
		this.activeAccessories = []
		this.log = log
		this.api = api
		this.syncHomeKitCache = syncHomeKitCache(this)
		this.name = PLATFORM_NAME
		this.enableHistoryStorage = config['enableHistoryStorage'] || false
		this.debug = config['debug'] || false
		this.PLUGIN_NAME = PLUGIN_NAME
		this.PLATFORM_NAME = PLATFORM_NAME

		if (this.enableHistoryStorage)
			this.FakeGatoHistoryService = require('fakegato-history')(this.api)

		
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
		if (!fs.existsSync(this.persistPath)){
			fs.mkdirSync(this.persistPath);
		}

		this.emptyState = {devices:{}}
		
		// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ //
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
			this.dolphinApi = dolphinApi(this)
			this.syncHomeKitCache()

		})

	}

	configureAccessory(accessory) {
		this.cachedAccessories.push(accessory)
	}

}
