module.exports = (device, platform) => {
	const Characteristic = platform.api.hap.Characteristic
	const log = platform.log
	const dolphinApi = platform.dolphinApi

	const updateDeviceState = (state) => {

		// update cache
		if (state.fixedTemperature && state.fixedTemperature === 'ON')
			device.state.fixedTemperature = 'ON'
		else
			device.state.fixedTemperature = 'OFF'
		if (state.Power && device.state.Power !== state.Power)
			device.state.Power = state.Power
		if (state.Power && device.state.Power !== state.Power)
			device.state.Power = state.Power
		if (state.Temperature && device.state.Temperature !== state.Temperature)
			device.state.Temperature = state.Temperature
		if (state.targetTemperature && device.state.targetTemperature !== state.targetTemperature)
			device.state.targetTemperature = state.targetTemperature
		if (state.showerTemperature)
			device.state.showerTemperature = state.showerTemperature


		if (device.hotWaterSensor && device.boilRequested === true && device.state.targetTemperature <= device.state.Temperature) {
			log.easyDebug(`"Hot Water" is ready for ${device.deviceName}`)
			device.boilRequested = false
			device.SensorService.getCharacteristic(device.SensorCharacteristic).updateValue(1)
			setTimeout(() => {
				device.SensorService.getCharacteristic(device.SensorCharacteristic).updateValue(0)
			}, 5000)
		}

		// update HomeKit
		if (device.state.Power === 'ON') {
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(1)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
		} else if (device.state.fixedTemperature === 'ON') {
			device.boilRequested = false
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
		} else {
			device.boilRequested = false
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0)
		}
		device.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(device.state.Temperature)
		device.ThermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(device.state.targetTemperature || 37)

		if (device.enableShowerSwitches && state.showerTemperature) {
			for (const switchDrop of Object.keys(device.showerSwitches)) {
				const dropFound = state.showerTemperature.find(shower => shower.drop == switchDrop)
				if (dropFound) {
					device.showerSwitches[switchDrop].getCharacteristic(device.dropTemp).updateValue(dropFound.temp)
					if (state.Temperature >= dropFound.temp)
						device.showerSwitches[switchDrop].getCharacteristic(Characteristic.On).updateValue(true)
					else
						device.showerSwitches[switchDrop].getCharacteristic(Characteristic.On).updateValue(false)
				}
			}
		}
	}

	const setUpdate = (res) => {
		const state = res.Status
		if (state)
			setTimeout(() => updateDeviceState(state), 1000)
	}

	return {

		get: {

			refreshState: () => {
				dolphinApi.getState(device.deviceName)
					.then(updateDeviceState)
					.catch(err => {
						log.error('The plugin could not refresh the status - ERROR OCCURRED:')
						log.error(err.message || err.stack || err)
					})
			},
		},
	
		set: {
			TargetHeatingCoolingState: (state) => {
				if (!state) {
					device.boilRequested = false
					log.easyDebug(`Turning OFF Device ${device.deviceName}`)
					return dolphinApi.turnOff(device.deviceName)
						.then(setUpdate)
						.catch(err => {
							log.error('The plugin could not set the state - ERROR OCCURRED:')
							log.error(err.message || err.stack)
						})
				} else {
					device.boilRequested = true
					log.easyDebug(`Turning ON Device ${device.deviceName} with Temperature ${device.state.targetTemperature || 37}ºC`)
					return dolphinApi.setFixedTemperature(device.deviceName, device.state.targetTemperature || 37)
						.then(setUpdate)
						.catch(err => {
							log.error('The plugin could not set the state - ERROR OCCURRED:')
							log.error(err.message || err.stack)
						})
				}
			},
		
			TargetTemperature: (temp) => {
				device.boilRequested = true
				log.easyDebug(`Setting Device ${device.deviceName} with Temperature ${temp}ºC`)
				return dolphinApi.setFixedTemperature(device.deviceName, temp)
					.then(setUpdate)
					.catch(err => {
						log.error('The plugin could not set the state - ERROR OCCURRED:')
						log.error(err.message || err.stack)
					})
			},

			ShowerSwitch: (numberOfShowers) => {
				device.boilRequested = true
				log.easyDebug(`Turning ON Device ${device.deviceName} for ${numberOfShowers} Showers`)
				return dolphinApi.turnOn(device.deviceName, '', numberOfShowers)
					.then(setUpdate)
					.catch(err => {
						log.error('The plugin could not set the state - ERROR OCCURRED:')
						log.error(err.message || err.stack)
					})
			}
		}
	}
}