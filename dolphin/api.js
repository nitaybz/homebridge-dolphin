const axios = require('axios');
const FormData = require('form-data');

let log, token
const REQUEST_TIMEOUT = 10000

module.exports = function (platform) {
	log = platform.log
	let statePromise
	let tokenPromise

	const getSecretKey = () => {
		if (token)
			return Promise.resolve(token)

		if (!tokenPromise) {
			tokenPromise = new Promise((resolve, reject) => {
				let data = new FormData();
				data.append('email', platform.email);
				data.append('password', platform.password);
				
				const config = {
					method: 'post',
					url: 'https://api.dolphinboiler.com/V2/getSecretKey.php',
					headers: { 
						...data.getHeaders()
					},
					data : data
				}

				axiosRequest(config)
					.then(response => {
						if (response.access_token) {
							token = response.access_token
							resolve(token)
						} else reject(response)
					})
					.catch(error => {
						reject(error)
					})
					.finally(() => {
						tokenPromise = null
					})
			})
		}
		return tokenPromise
	}

	return {
	
		getState: async (deviceName) => {
			let secretKey
			try {
				secretKey = await getSecretKey()
			} catch (err) {
				log.easyDebug(`Can't Get Secret Key: ${err}`)
				throw err
			}
			
			if (!statePromise) {
				statePromise = new Promise((resolve, reject) => {
					
					let data = new FormData();
					data.append('deviceName', deviceName);
					data.append('email', platform.email);
					data.append('secretKey', secretKey);
					
					const config = {
						method: 'post',
						url: 'https://api.dolphinboiler.com/V2/getMainScreenData.php',
						headers: { 
							...data.getHeaders()
						},
						data : data
					};

					axiosRequest(config)
						.then(response => {
							resolve(response)
						})
						.catch(error => {
							reject(error)
						})
						.finally(() => {
							statePromise = null
						})

				})
			}
			return statePromise

		},
	
		setFixedTemperature: async (deviceName, targetTemperature) => {
			let secretKey
			try {
				secretKey = await getSecretKey()
			} catch (err) {
				log.easyDebug(`Can't Get Secret Key: ${err}`)
				throw err
			}

			let data = new FormData();
			data.append('deviceName', deviceName);
			data.append('email', platform.email);
			data.append('secretKey', secretKey);
			data.append('temperature', targetTemperature || '');
			
			const config = {
				method: 'post',
				url: 'https://api.dolphinboiler.com/V2/setFixedTemperature.php',
				headers: { 
					...data.getHeaders()
				},
				data : data
			};
			
			return axiosRequest(config)
		},
	
		turnOn: async (deviceName, targetTemperature, quantity) => {
			let secretKey
			try {
				secretKey = await getSecretKey()
			} catch (err) {
				log.easyDebug(`Can't Get Secret Key: ${err}`)
				throw err
			}

			let data = new FormData();
			data.append('deviceName', deviceName);
			data.append('email', platform.email);
			data.append('secretKey', secretKey);
			data.append('quantity', quantity || '');
			data.append('targetTemperature', targetTemperature || '');
			
			const config = {
				method: 'post',
				url: 'https://api.dolphinboiler.com/V2/turnOnManually.php',
				headers: { 
					...data.getHeaders()
				},
				data : data
			};
			
			return axiosRequest(config)
		},
	
		turnOff: async (deviceName) => {
			let secretKey
			try {
				secretKey = await getSecretKey()
			} catch (err) {
				log.easyDebug(`Can't Get Secret Key: ${err}`)
				throw err
			}


			let data = new FormData();
			data.append('deviceName', deviceName);
			data.append('email', platform.email);
			data.append('secretKey', secretKey);
			
			const config = {
				method: 'post',
				url: 'https://api.dolphinboiler.com/V2/turnOffManually.php',
				headers: { 
					...data.getHeaders()
				},
				data : data
			};
			
			return axiosRequest(config)
		}
	}
}

const axiosRequest = (config) => {
	return new Promise((resolve, reject) => {
		config.timeout = REQUEST_TIMEOUT
		axios(config)
			.then(function (response) {
				const res = response
				if (res.error || res.data.Error) {
					reject(res.error || res.data.Error)
					return
				}
				log.easyDebug('Response:', JSON.stringify(res.data))
				resolve(res.data)
			})
			.catch(function (error) {
				try {
					const errMessage = error.toJSON().message
					reject(errMessage)
				} catch(err) {
					reject(error)
				}
			})
	})
}