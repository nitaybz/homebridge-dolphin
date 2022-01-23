const Thermostat = require('../homekit/Thermostat')

module.exports = (platform) => {
	return () => {
		platform.devices.forEach(device => {
			if (device.deviceName)
				new Thermostat(device, platform)
		})

		// find devices to remove
		const accessoriesToRemove = []
		platform.cachedAccessories.forEach(accessory => {
			let deviceExists = platform.devices.find(device => device.serial === accessory.context.deviceId)
			if (!deviceExists)
				accessoriesToRemove.push(accessory)
		})

		if (accessoriesToRemove.length) {
			platform.log.easyDebug('Unregistering Unnecessary Cached Devices:')
			platform.log.easyDebug(accessoriesToRemove)

			// unregistering accessories
			platform.api.unregisterPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, accessoriesToRemove)

			// remove from cachedAccessories
			platform.cachedAccessories = platform.cachedAccessories.filter( cachedAccessory => !accessoriesToRemove.find(accessory => accessory.UUID === cachedAccessory.UUID) )

		}
	}
}