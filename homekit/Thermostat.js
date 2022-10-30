let Characteristic, Service

class Thermostat {
	constructor(device, platform) {

		Service = platform.api.hap.Service
		Characteristic = platform.api.hap.Characteristic
		this.customCharacteristic = require('./customCharacteristic')(platform.api.hap)

		this.enableShowerSwitches = device.enableShowerSwitches
		this.enableHistoryStorage = platform.enableHistoryStorage
		this.hotWaterSensor = device.hotWaterSensor
		this.connectionSensor = device.connectionSensor
		this.deviceName = device.serial
		this.resetHour = device.showersTodayResetHour || 0
		this.log = platform.log
		this.api = platform.api
		this.id = this.deviceName
		this.model = 'Homebridge-Dolphin'
		this.serial = this.deviceName
		this.manufacturer = 'Dolphin'
		this.name = device.name || `Dolphin ${this.deviceName}`
		this.displayName = this.name
		this.showerSwitches = {}
		this.boilRequested =  false

		this.UUID = this.api.hap.uuid.generate(this.id.toString())
		this.accessory = platform.cachedAccessories.find(accessory => accessory.UUID === this.UUID)

		if (!this.accessory) {
			this.log(`Creating New ${platform.PLATFORM_NAME} Accessory (${this.name})`)
			this.accessory = new this.api.platformAccessory(this.name  + ' Main', this.UUID)
			this.accessory.context.deviceId = this.id
			this.accessory.context.state = {}

			platform.cachedAccessories.push(this.accessory)
			// register the accessory
			this.api.registerPlatformAccessories(platform.PLUGIN_NAME, platform.PLATFORM_NAME, [this.accessory])
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

		this.stateManager.get.refreshState()
		setInterval(this.stateManager.get.refreshState, 30000)

		this.stateManager.get.refreshShowersToday()
		setInterval(this.stateManager.get.refreshShowersToday, 300000)

		if (this.enableShowerSwitches) {
			this.dropsInterval = setInterval(() => {
				if (this.state.showerTemperature && this.state.showerTemperature.length) {
					this.refreshDrops()
					setInterval(this.refreshDrops.bind(this), 30000)
					clearInterval(this.dropsInterval)
				}
			}, 5000)
		} else
			this.removeDrops()

		if (this.hotWaterSensor)
			this.addHotWaterSensorService(this.hotWaterSensor)
		else
			this.removeHotWaterSensorService()

		if (this.connectionSensor)
			this.addConnectionSensorService()
		else
			this.removeConnectionSensorService()
		


		if (this.enableHistoryStorage) {
			this.log('Starting FakeGato History Service...')
			this.accessory.log = this.log;
			this.loggingService = new platform.FakeGatoHistoryService('thermo', this.accessory, { size: 20160, disableTimer:true, storage: 'fs', path: platform.persistPath })
		}

	}

	addThermostatService() {
		this.log.easyDebug(`Adding Thermostat Service for Dolphin device (${this.deviceName})`)
		this.ThermostatService = this.accessory.getService(Service.Thermostat)
		if (!this.ThermostatService)
			this.ThermostatService = this.accessory.addService(Service.Thermostat, this.name, 'Thermostat')

		this.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)

		this.ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
			.updateValue(0)

		const props = [Characteristic.TargetHeatingCoolingState.OFF, Characteristic.TargetHeatingCoolingState.HEAT]
	
		this.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
			.setProps({
				validValues: props,
				minValue: 0,
				maxValue: 1
			})
			.onSet(this.stateManager.set.TargetHeatingCoolingState)


		this.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({
				minValue: -100,
				maxValue: 100,
				minStep: 1
			})

		this.ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
			.setProps({
				minValue: 37,
				maxValue: 80,
				minStep: 1
			})
			.onSet(this.stateManager.set.TargetTemperature)

		if (this.enableHistoryStorage) {
			this.log.easyDebug('Starting optional Characteristics for History...')
			this.ThermostatService.addOptionalCharacteristic(this.customCharacteristic.ValvePosition)
			this.ThermostatService.getCharacteristic(this.customCharacteristic.ValvePosition)
			this.ThermostatService.addOptionalCharacteristic(this.customCharacteristic.ProgramCommand)
			this.ThermostatService.getCharacteristic(this.customCharacteristic.ProgramCommand)
			this.ThermostatService.addOptionalCharacteristic(this.customCharacteristic.ProgramData)
			this.ThermostatService.getCharacteristic(this.customCharacteristic.ProgramData)
				.updateValue(Buffer.from('ff04f6', 'hex').toString('base64'))
		}

		// add "Showers Today" Sensor
		this.log.easyDebug('Adding "Showers Today" Sensor...')
		this.ThermostatService.addOptionalCharacteristic(this.customCharacteristic.ShowersToday)
		this.ThermostatService.getCharacteristic(this.customCharacteristic.ShowersToday)
			.updateValue(0)
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
			.onSet(state => {
				if (state)
					return this.stateManager.set.ShowerSwitch(numberOfShowers)
				return Promise.resolve()
			})
				
		
		this.showerSwitches[numberOfShowers].addOptionalCharacteristic(this.customCharacteristic.DropTemp)
		if (this.state.showerTemperature)
			this.showerSwitches[numberOfShowers].getCharacteristic(this.customCharacteristic.DropTemp).updateValue(this.state.showerTemperature.find(shower => shower.drop == numberOfShowers).temp)
		else
			this.showerSwitches[numberOfShowers].getCharacteristic(this.customCharacteristic.DropTemp).updateValue(37)

	}

	removeSwitchService(numberOfShowers) {
		const name = getShowerName(numberOfShowers)
		let ShowerSwitch = this.accessory.getService(name)
		if (ShowerSwitch) {
			// remove service
			this.accessory.removeService(ShowerSwitch)
		}
	}


	addHotWaterSensorService(sensorType) {

		const sensorTypes = ['LeakSensor', 'ContactSensor', 'OccupancySensor']

		if (!sensorTypes.includes(sensorType)) {
			this.log.error('Wrong Sensor Type - NOT ADDING SENSOR')
			return
		}

		this.SensorCharacteristic = (() => {
			switch (sensorType) {
				case 'LeakSensor':
					return Characteristic.LeakDetected
				case 'ContactSensor':
					return Characteristic.ContactSensorState
				default:
					return Characteristic.OccupancyDetected
			}
		})()

		const name = 'Hot Water'
		this.log.easyDebug(`Adding "${name}" ${sensorType} Service for Dolphin device (${this.deviceName})`)

		this.SensorService = this.accessory.getService(name)
		if (!this.SensorService)
			this.SensorService = this.accessory.addService(Service[sensorType], name, name + this.deviceName)

		this.SensorService.getCharacteristic(this.SensorCharacteristic)
			.updateValue(0)


		sensorTypes.forEach(type => {
			if (type !== sensorType) {
				let removeSensor = this.accessory.getService(Service[type])
				if (removeSensor) {
					this.log.easyDebug(`Removing "${name}" ${type} Service from Dolphin device (${this.deviceName})`)
					this.accessory.removeService(removeSensor)
				}
			}
		})
				

	}

	removeHotWaterSensorService() {
		let sensor = this.accessory.getService('Hot Water')
		if (sensor) {
			// remove service
			this.accessory.removeService(sensor)
		}
	}

	
	addConnectionSensorService() {

		const name = 'Dolphin Connection'
		this.log.easyDebug(`Adding "${name}" Contact Sensor Service for Dolphin device (${this.deviceName})`)

		this.ConnectionSensorService = this.accessory.getService(name)
		if (!this.ConnectionSensorService)
			this.ConnectionSensorService = this.accessory.addService(Service.ContactSensor, name, name + this.deviceName)

		this.ConnectionSensorService.getCharacteristic(Characteristic.ContactSensorState)
			.updateValue(1)
				
	}

	removeConnectionSensorService() {
		let sensor = this.accessory.getService('Dolphin Connection')
		if (sensor) {
			// remove service
			this.accessory.removeService(sensor)
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
