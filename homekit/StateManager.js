module.exports = (device, platform) => {
	const Characteristic = platform.api.hap.Characteristic
	const log = platform.log
	const dolphinApi = platform.dolphinApi
	const HapError = () => {
		return new platform.api.hap.HapStatusError(-70402)
	}

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

		if (device.ConnectionSensorService)
			device.ConnectionSensorService.getCharacteristic(Characteristic.ContactSensorState).updateValue(1)

		// update HomeKit
		if (device.state.Power === 'ON') {
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(1)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
			device.ThermostatService.getCharacteristic(device.customCharacteristic.ValvePosition).updateValue(100)
			if (device.loggingService) {
				device.loggingService.addEntry({time: Math.round(new Date().valueOf() / 1000), currentTemp: device.state.Temperature, setTemp: device.state.targetTemperature, valvePosition: 100})
				device.ThermostatService.getCharacteristic(device.customCharacteristic.ValvePosition).updateValue(100)
			}
		} else {
			if (device.state.fixedTemperature === 'ON')
				device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
			else
				device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0)

			device.boilRequested = false
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
			if (device.loggingService) {
				device.loggingService.addEntry({time: Math.round(new Date().valueOf() / 1000), currentTemp: device.state.Temperature, setTemp: device.state.targetTemperature, valvePosition: 0})
				device.ThermostatService.getCharacteristic(device.customCharacteristic.ValvePosition).updateValue(0)
			}
		}

		device.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(device.state.Temperature)
		device.ThermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(device.state.targetTemperature || 37)


		if (device.enableShowerSwitches && state.showerTemperature) {
			for (const switchDrop of Object.keys(device.showerSwitches)) {
				const dropFound = state.showerTemperature.find(shower => shower.drop == switchDrop)
				if (dropFound) {
					device.showerSwitches[switchDrop].getCharacteristic(device.customCharacteristic.DropTemp).updateValue(dropFound.temp)
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
		device.ignoreOnCommand = false
		device.setCommands = []
		if (state)
			setTimeout(() => updateDeviceState(state), 1000)
	}

	const errHandler = (err) => {
		device.setCommands = []
		log.error('The plugin could not set the state - ERROR OCCURRED:')
		log.error(err.message || err.stack || err)
	}

	const setState = (command) => {
		device.setCommands.push(command)
		clearTimeout(device.setStateTimeout)
		return device.setStateTimeout = setTimeout(() => {
			const turnOff = device.setCommands.find(command => command.state === 0)

			if (turnOff) {
				device.boilRequested = false
				log.easyDebug(`Turning OFF Device ${device.deviceName}`)
				return dolphinApi.turnOff(device.deviceName)
					.then(setUpdate)
					.catch(errHandler)
			} else {
				let setTemp = device.setCommands.find(command => command.temp)
				setTemp = setTemp ? setTemp.temp : device.state.targetTemperature || 37
				device.boilRequested = true
				log.easyDebug(`Turning ON Device ${device.deviceName} with Temperature ${setTemp}ºC`)
				return dolphinApi.setFixedTemperature(device.deviceName, setTemp)
					.then(setUpdate)
					.catch(errHandler)
			}

		}, 500)
	}

	return {

		get: {

			refreshState: () => {
				dolphinApi.getState(device.deviceName)
					.then(updateDeviceState)
					.catch(err => {
						log.error('The plugin could not refresh the status - ERROR OCCURRED:')
						log.error(err.message || err.stack || err)
						device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(HapError())
						if (device.SensorService)
							device.ThermostatService.getCharacteristic(device.SensorCharacteristic).updateValue(HapError())
						if (device.enableShowerSwitches)
							for (const switchDrop of Object.keys(device.showerSwitches))
								device.showerSwitches[switchDrop].getCharacteristic(Characteristic.On).updateValue(HapError())

						if (device.ConnectionSensorService)
							device.ConnectionSensorService.getCharacteristic(Characteristic.ContactSensorState).updateValue(0)
					})
			},
		},
	
		set: {
			TargetHeatingCoolingState: (state) => {
				return setState({state})
			},
		
			TargetTemperature: (temp) => {
				return setState({temp})
			},

			ShowerSwitch: (numberOfShowers) => {
				device.boilRequested = true
				log.easyDebug(`Turning ON Device ${device.deviceName} for ${numberOfShowers} Showers`)
				return dolphinApi.turnOn(device.deviceName, '', numberOfShowers)
					.then(setUpdate)
					.catch(errHandler)
			}
		}
	}
}