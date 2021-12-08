module.exports = (hap) => {
	class dropTemp extends hap.Characteristic {
		constructor() {
			super('Target Temperature', dropTemp.UUID);
			this.setProps({
				format: hap.Formats.FLOAT,
				unit: hap.Units.CELSIUS,
				minValue: 37,
				maxValue: 70,
				minStep: 1,
				perms: [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY]
			});
			this.value = this.getDefaultValue()
		}
	}

	dropTemp.UUID = '000000CE-0000-1000-8000-0026ABCDEF01'
	
	return dropTemp
}