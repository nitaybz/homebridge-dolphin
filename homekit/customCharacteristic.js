module.exports = (hap) => {
	class DropTemp extends hap.Characteristic {
		constructor() {
			super('Target Temperature', DropTemp.UUID);
			this.setProps({
				format: hap.Formats.FLOAT,
				unit: hap.Units.CELSIUS,
				minValue: 37,
				maxValue: 80,
				minStep: 1,
				perms: [hap.Perms.PAIRED_READ, hap.Perms.NOTIFY]
			});
			this.value = this.getDefaultValue()
		}
	}

	DropTemp.UUID = '000000CE-0000-1000-8000-0026ABCDEF01'

	// EVE 


	class ProgramCommand extends hap.Characteristic {
		constructor() {
			super('Program Command', ProgramCommand.UUID, {
				format: hap.Formats.DATA,
				perms: [hap.Perms.WRITE]
			});
		}
	}

	ProgramCommand.UUID = 'E863F12C-079E-48FF-8F27-9C2605A29F52';


	class ProgramData extends hap.Characteristic {
		constructor() {
			super('Program Data', ProgramData.UUID, {
				format: hap.Formats.DATA,
				perms: [hap.Perms.READ, hap.Perms.NOTIFY]
			});
		}
	}
	ProgramData.UUID = 'E863F12F-079E-48FF-8F27-9C2605A29F52';


	class ValvePosition extends hap.Characteristic {
		constructor() {
			super('Valve Position', ValvePosition.UUID, {
				format: hap.Formats.UINT8,
				unit: hap.Units.PERCENTAGE,
				minValue: 0,
				maxValue: 100,
				perms: [hap.Perms.READ, hap.Perms.NOTIFY]
			});
		}
	}
	ValvePosition.UUID = 'E863F12E-079E-48FF-8F27-9C2605A29F52';
	
	return {DropTemp, ProgramData, ProgramCommand, ValvePosition}
}