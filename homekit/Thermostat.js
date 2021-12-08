let Characteristic, Service, dropTemp

class Thermostat {
	constructor(device, platform) {

		Service = platform.api.hap.Service
		Characteristic = platform.api.hap.Characteristic

		dropTemp = require('./dropTemp')(platform.api.hap)


		this.deviceName = device.serial
		this.log = platform.log
		this.api = platform.api
		this.storage = platform.storage
		this.id = this.deviceName
		this.model = 'Homebridge-Dolphin'
		this.serial = this.deviceName
		this.manufacturer = 'Dolphin'
		this.name = device.name || `Dolphin ${this.deviceName}`
		this.displayName = this.name
		this.showerSwitches = {}

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

		this.state = this.accessory.context.state

		this.stateManager = require('./StateManager')(this, platform)

		let informationService = this.accessory.getService(Service.AccessoryInformation)

		if (!informationService)
			informationService = this.accessory.addService(Service.AccessoryInformation)

		informationService
			.setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
			.setCharacteristic(Characteristic.Model, this.model)
			.setCharacteristic(Characteristic.SerialNumber, this.serial)

		this.addThermostatService()

		if (device.enableShowerSwitches) {
			this.dropsInterval = setInterval(() => {
				if (this.state.showerTemperature && this.state.showerTemperature.length) {
					this.refreshDrops()
					setInterval(this.refreshDrops.bind(this), 60000)
					clearInterval(this.dropsInterval)
				}
			}, 5000)
		} else
			this.removeDrops()
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
			.setProps({
				validValues: props,
				minValue: 0,
				maxValue: 1
			})
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
	
	addSwitchService(numberOfShowers) {
		const name = getShowerName(numberOfShowers)
		this.log.easyDebug(`Adding "${name}" Switch Service for Dolphin device (${this.deviceName})`)

		this.showerSwitches[numberOfShowers] = this.accessory.getService(name)
		if (!this.showerSwitches[numberOfShowers])
			this.showerSwitches[numberOfShowers] = this.accessory.addService(Service.Switch, name, name + this.deviceName)

		this.showerSwitches[numberOfShowers].getCharacteristic(Characteristic.On)
			.onGet(() => false)
			.onSet(state => {
				if (state)
					return this.stateManager.set.ShowerSwitch(numberOfShowers)
						.then(() => setTimeout(() => this.showerSwitches[numberOfShowers].getCharacteristic(Characteristic.On).updateValue(false), 2000))
				return Promise.resolve()
			})
				
		
		const dropTempCharacteristic = this.showerSwitches[numberOfShowers].getCharacteristic(dropTemp)
		if (!dropTempCharacteristic)
			this.showerSwitches[numberOfShowers].addOptionalCharacteristic(dropTemp)
				.onGet(() => {
					const drop = this.state.showerTemperature.find(shower => shower.drop == numberOfShowers)
					if (drop)
						return drop.temp
					else 
						return new Error('No Drops found')
				})

	}

	removeSwitchService(numberOfShowers) {
		const name = getShowerName(numberOfShowers)
		let ShowerSwitch = this.accessory.getService(name)
		if (ShowerSwitch) {
			// remove service
			this.accessory.removeService(ShowerSwitch)
		}
	}

	refreshDrops() {
		if (this.state && this.state.showerTemperature && this.state.showerTemperature.length) {
			
			// search for new drops to add
			this.state.showerTemperature.forEach(shower => {
				if (!this.showerSwitches[shower.drop]) {
					this.addSwitchService(shower.drop)
				}
			})

			// search for drops to remove
			for (const switchDrop of Object.keys(this.showerSwitches)) {
				const dropFound = this.state.showerTemperature.find(shower => shower.drop == switchDrop)
				if (!dropFound) {
					this.log.easyDebug(`Removing ${getShowerName(switchDrop)} Switch (${this.deviceName})`)
					delete this.showerSwitches[switchDrop]
					this.removeSwitchService(switchDrop)
				}
			}
		}
	}


	removeDrops() {
		for (let numberOfShowers = 1; numberOfShowers < 7; numberOfShowers++) {
			const name = getShowerName(numberOfShowers)
			let ShowerSwitch = this.accessory.getService(name)
			if (ShowerSwitch) {
				this.log.easyDebug(`Removing ${name} Switch (${this.deviceName})`)
				this.accessory.removeService(ShowerSwitch)
			}
		}
	}
	
}

const getShowerName = (numberOfShowers) => {
	return `${numberOfShowers} Shower${numberOfShowers > 1 ? 's' : ''}`
}



module.exports = Thermostat
