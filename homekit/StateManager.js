module.exports = (device, platform) => {
	const Characteristic = platform.api.hap.Characteristic
	const log = platform.log
	const dolphinApi = platform.dolphinApi

	const updateDeviceState = (state) => {
		if (state.Power && device.state.Power !== state.Power)
			device.state.Power = state.Power
		if (state.Temperature && device.state.Temperature !== state.Temperature)
			device.state.Temperature = state.Temperature
		if (state.targetTemperature && device.state.targetTemperature !== state.targetTemperature)
			device.state.targetTemperature = state.targetTemperature
		if (state.showerTemperature)
			device.state.showerTemperature = state.showerTemperature
	}

	const updateState = (res) => {
		const state = res.Status
		if (res.Status) {
			updateDeviceState(state)
			if (state.Power === 'OFF') {
				device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
				device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0)
			} else {
				device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(1)
				device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
				if (state.targetTemperature)
					device.ThermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(state.targetTemperature)
			}
			device.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(state.Temperature)
		} else { // patch for not getting status on OFF command
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0)
			device.state.Power = 'OFF'
		}
	}

	return {

		get: {

			CurrentHeatingCoolingState: () => {
				return dolphinApi.getState(device.deviceName)
					.then(state => {
						updateDeviceState(state)
						log.easyDebug(`[CurrentHeatingCoolingState] Device ${device.deviceName} is ${state.fixedTemperature || state.Power}`)
						if ((!state.fixedTemperature || state.fixedTemperature !== 'ON') && state.Power === 'OFF')
							return Characteristic.CurrentHeatingCoolingState.OFF
						else
							return Characteristic.CurrentHeatingCoolingState.HEAT
					})
					.catch(err => {
						throw err
					})
			},

			TargetHeatingCoolingState: () => {

				return dolphinApi.getState(device.deviceName)
					.then(state => {
						updateDeviceState(state)
						log.easyDebug(`[TargetHeatingCoolingState] Device ${device.deviceName} is ${state.fixedTemperature || state.Power}`)
						if ((!state.fixedTemperature || state.fixedTemperature !== 'ON') && state.Power === 'OFF')
							return Characteristic.TargetHeatingCoolingState.OFF
						else
							return Characteristic.TargetHeatingCoolingState.HEAT
					})
					.catch(err => {
						throw err
					})
			},

			CurrentTemperature: () => {
				return dolphinApi.getState(device.deviceName)
					.then(state => {
						updateDeviceState(state)
						log.easyDebug(`[TargetHeatingCoolingState] Device ${device.deviceName} Temperature is ${state.Temperature}ºC`)
						return state.Temperature
					})
					.catch(err => {
						throw err
					})
			},

			TargetTemperature: () => {
				return dolphinApi.getState(device.deviceName)
					.then(state => {
						updateDeviceState(state)
						log.easyDebug(`[TargetTemperature] Device ${device.deviceName} Target Temperature is ${device.state.targetTemperature || 37}ºC`)
						return device.state.targetTemperature || 37
					})
					.catch(err => {
						throw err
					})
			},

		},
	
		set: {
			TargetHeatingCoolingState: (state) => {
				if (!state) {
					log.easyDebug(`Turning OFF Device ${device.deviceName}`)
					return dolphinApi.turnOff(device.deviceName)
						.then(updateState)
				} else {
					log.easyDebug(`Turning ON Device ${device.deviceName} with Temperature ${device.state.targetTemperature || 37}ºC`)
					return dolphinApi.setFixedTemperature(device.deviceName, device.state.targetTemperature || 37)
						.then(updateState)
				}
			},
		
			TargetTemperature: (temp) => {
				log.easyDebug(`Setting Device ${device.deviceName} with Temperature ${temp}ºC`)
				return dolphinApi.setFixedTemperature(device.deviceName, temp)
					.then(updateState)
			},

			ShowerSwitch: (numberOfShowers) => {
				log.easyDebug(`Turning ON Device ${device.deviceName} for ${numberOfShowers} Showers`)
				return dolphinApi.turnOn(device.deviceName, '', numberOfShowers)
					.then(updateState)
			}
		}
	}
}