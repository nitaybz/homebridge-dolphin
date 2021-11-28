const axios = require('axios');
const FormData = require('form-data');

let log

module.exports = function (platform) {
	log = platform.log
	let statePromise

	return {
	
		getState: (deviceName) => {
			

			if (!statePromise) {
				statePromise = new Promise((resolve, reject) => {
					
					let data = new FormData();
					data.append('deviceName', deviceName);
					data.append('email', platform.email);
					data.append('secretKey', platform.secretKey);
					
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
							setTimeout(() => {
								
								statePromise = null
							})
						})

				})
			}
			return statePromise

		},
	
		turnOn: (deviceName, targetTemperature, quantity) => {
			let data = new FormData();
			data.append('deviceName', deviceName);
			data.append('email', platform.email);
			data.append('secretKey', platform.secretKey);
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
	
		turnOff: (deviceName) => {
			let data = new FormData();
			data.append('deviceName', deviceName);
			data.append('email', platform.email);
			data.append('secretKey', platform.secretKey);
			
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
	return axios(config)
		.then(function (response) {
			const res = response
			if (res.error) {
				log(res.error);
				throw res.error
			}
			log.easyDebug(res.data);
			return res.data
		})
		.catch(function (error) {
			log(error);
			throw error
		});
}