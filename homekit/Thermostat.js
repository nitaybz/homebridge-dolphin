let Characteristic, Service

class AirConditioner {
	constructor(deviceName, platform) {

		Service = platform.api.hap.Service
		Characteristic = platform.api.hap.Characteristic

		this.deviceName = deviceName
		this.log = platform.log
		this.api = platform.api
		this.storage = platform.storage
		this.id = this.deviceName
		this.model = 'Homebridge-Dolphin'
		this.serial = this.deviceName
		this.manufacturer = 'Dolphin'
		this.name = `Dolphin ${deviceName}`
		this.displayName = this.name

		this.UUID = this.api.hap.uuid.generate(this.id.toString())
		this.accessory = platform.cachedAccessories.find(accessory => accessory.UUID === this.UUID)


		if (!this.accessory) {
			this.log(`Creating New ${platform.PLATFORM_NAME} Accessory (${this.name})`)
			this.accessory = new this.api.platformAccessory(this.name, this.UUID)
			this.accessory.context.deviceId = this.id
			this.accessory.context.state = {}

			platform.cachedAccessories.push(this.accessory)
			// register the accessory
			this.api.registerPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [this.accessory])
		}

		if (platform.enableHistoryStorage) {
			const FakeGatoHistoryService = require('fakegato-history')(this.api)
			this.loggingService = new FakeGatoHistoryService('weather', this.accessory, { storage: 'fs', path: platform.persistPath })
		}

		this.stateManager = require('./StateManager')(this, platform)

		let informationService = this.accessory.getService(Service.AccessoryInformation)

		if (!informationService)
			informationService = this.accessory.addService(Service.AccessoryInformation)

		informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)
	

		this.addThermostatService()
	}

	addThermostatService() {
		this.log.easyDebug(`Adding Thermostat Service for Dolphin device (${this.deviceName})`)
		this.ThermostatService = this.accessory.getService(Service.Thermostat)
		if (!this.ThermostatService)
			this.ThermostatService = this.accessory.addService(Service.Thermostat, this.name, 'Thermostat')

		this.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			.onGet(this.stateManager.get.CurrentHeatingCoolingState)


		const props = [Characteristic.TargetHeatingCoolingState.OFF, Characteristic.TargetHeatingCoolingState.HEAT]
	
		this.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.setProps({validValues: props})
			.onGet(this.stateManager.get.TargetHeatingCoolingState)
			.onSet(this.stateManager.set.TargetHeatingCoolingState)


		this.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: -100,
				maxValue: 100,
				minStep: 1
			})
			.onGet(this.stateManager.get.CurrentTemperature)

		this.ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: 37,
				maxValue: 70,
				minStep: 1
			})
			.onGet(this.stateManager.get.TargetTemperature)
			.onSet(this.stateManager.set.TargetTemperature)

	}

	// removeThermostatService() {
	// 	let ThermostatService = this.accessory.getService(Service.Thermostat)
	// 	if (ThermostatService) {
	// 		// remove service
	// 		this.log.easyDebug(`Removing Thermostat Service from the ${this.roomName}`)
	// 		this.accessory.removeService(ThermostatService)
	// 	}
	// }
	
	// addManualControlService() {
	// 	this.log.easyDebug(`Adding Manual Control Switch Service in the ${this.roomName}`)

	// 	this.ManualControlService = this.accessory.getService(this.name + ' Manual')
	// 	if (!this.ManualControlService)
	// 		this.ManualControlService = this.accessory.addService(Service.Switch, this.name + ' Manual', 'ManualControl')


	// 	this.ManualControlService.getCharacteristic(Characteristic.On)
	// 		.onGet(this.stateManager.get.ManualControl)
	// 		.onSet(this.stateManager.set.ManualControl)

	// }

	// removeManualControlService() {
	// 	let ManualControlService = this.accessory.getService(this.name + ' Manual')
	// 	if (ManualControlService) {
	// 		// remove service
	// 		this.log.easyDebug(`Removing Manual Control Switch Service from the ${this.roomName}`)
	// 		this.accessory.removeService(ManualControlService)
	// 	}
	// }

	
}


module.exports = AirConditioner