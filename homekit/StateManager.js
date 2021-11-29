module.exports = (device, platform) => {
	const Characteristic = platform.api.hap.Characteristic
	const log = platform.log
	const dolphinApi = platform.dolphinApi
	const deviceCache = device.accessory.context.state

	const updateDeviceCache = (state) => {
		if (state.Power && deviceCache.Power !== state.Power)
			deviceCache.Power = state.Power
		if (state.Temperature && deviceCache.Temperature !== state.Temperature)
			deviceCache.Temperature = state.Temperature
		if (state.targetTemperature && deviceCache.targetTemperature !== state.targetTemperature)
			deviceCache.targetTemperature = state.targetTemperature
		if (state.showerTemperature)
			deviceCache.showerTemperature = state.showerTemperature
	}

	const updateState = (res) => {
		const state = res.Status
		updateDeviceCache(state)
		if (state.Power === 'OFF') {
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(0)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(0)
		} else {
			device.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(1)
			device.ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(1)
			device.ThermostatService.getCharacteristic(Characteristic.TargetTemperature).updateValue(state.targetTemperature)
		}
		device.ThermostatService.getCharacteristic(Characteristic.CurrentTemperature).updateValue(state.Temperature)
	}

	return {

		get: {

			CurrentHeatingCoolingState: () => {
				return dolphinApi.getState(device.deviceName)
					.then(state => {
						updateDeviceCache(state)
						log.easyDebug(`[CurrentHeatingCoolingState] Device ${device.deviceName} is ${state.Power}`)
						if (state.Power === 'OFF')
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
						updateDeviceCache(state)
						log.easyDebug(`[TargetHeatingCoolingState] Device ${device.deviceName} is ${state.Power}`)
						if (state.Power === 'OFF')
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
						updateDeviceCache(state)
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
						updateDeviceCache(state)
						log.easyDebug(`[TargetTemperature] Device ${device.deviceName} Target Temperature is ${deviceCache.targetTemperature || 37}ºC`)
						return deviceCache.targetTemperature || 37
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
					log.easyDebug(`Turning ON Device ${device.deviceName} with Temperature ${deviceCache.targetTemperature || 37}ºC`)
					return dolphinApi.turnOn(device.deviceName, deviceCache.targetTemperature || 37)
						.then(updateState)
				}
			},
		
			TargetTemperature: (temp) => {
				log.easyDebug(`Setting Device ${device.deviceName} with Temperature ${temp}ºC`)
				return dolphinApi.turnOn(device.deviceName, temp)
					.then(updateState)
			},
		}
	}
}