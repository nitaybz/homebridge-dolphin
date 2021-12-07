<img src="https://github.com/nitaybz/homebridge-dolphin/raw/master/branding/dolphin_homebridge.png" width="400px">


# homebridge-dolphin

[![Downloads](https://img.shields.io/npm/dt/homebridge-dolphin.svg?color=critical)](https://www.npmjs.com/package/homebridge-dolphin)
[![Version](https://img.shields.io/npm/v/homebridge-dolphin)](https://www.npmjs.com/package/homebridge-dolphin)<br>

[Homebridge](https://github.com/nfarina/homebridge) Plugin for Dolphin Boiler - Smart Water Heating Control.

### Requirements

<img src="https://img.shields.io/badge/node-%3E%3D14.5-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/homebridge-%3E%3D1.3.4-brightgreen"> &nbsp;
<img src="https://img.shields.io/badge/iOS-%3E%3D14.0.0-brightgreen">

check with: `node -v` & `homebridge -V` and update if needed

## Installation

This plugin can be easily installed and configured through Homebridge/Hoobs UI.

If you don't use Homebridge UI or HOOBS, or if you want to know more about the plugin features and options, keep reading...

1. Install homebridge using: `sudo npm install -g homebridge --unsafe-perm`
2. Install this plugin using: `sudo npm install -g homebridge-dolphin`
3. Update your configuration file. See `sample-config.json` in this repository for a sample.

\* install from git: `sudo npm install -g git+https://github.com/nitaybz/homebridge-dolphin.git`

## Config file

``` json
"platforms": [
    {
        "platform": "Dolphin",
        "email": "user@name.com",
        "secretKey": "*************",
        "devices": [
            {
            "serial": "YFUY323DG43",
            "name": "Dolphin Boiler",
            "enableShowerSwitches": true
            }
        ]
    }
]
```

## Configurations

|             Parameter            |                       Description                       | Required |  Default  |  type  |
| -------------------------------- | ------------------------------------------------------- |:--------:|:---------:|:---------:|
| `platform`                       | always "Dolphin"    |     ✓    |      -    |  String  |
| `email`                       | your Dolphin account email     |     ✓    |      -    |  String  |
| `secretKey`                       | your Dolphin account API secret key                              |     ✓    |      -    |  String  |
| `debug`       |  When set to `true`, the plugin will produce extra logs for debugging purposes        |          |  `false` |   Boolean / Array*  |
| **Devices**                       | List of Dolphin devices (with the below information)             |     ✓    |      -    |  Array   |
| `serial`                          | Your Dolphin device serial number                                |     ✓    |      -    |  String  |
| `name`                            | The accessory name that will appear in HomeKit                   |     ✓    |      -    |  String  |
| `enableShowerSwitches`            | Enabling this will create switch for each amount of showers your boiler is capable of. It will allow you to turn on the boiler for X showers     |     ✓    |   true   |  Boolean |

<br>
---

## Troubleshooting

### Report Issues & Debug
If you experience any issues with the plugins please refer to the [Issues](https://github.com/nitaybz/homebridge-dolphin/issues) tab and check if your issue is already described there, if it doesn't, please create a new issue with as much detailed information as you can give (logs are crucial).<br>

if you want to even speed up the process, you can add `"debug": true` to your config, which will give me more details on the logs and speed up fixing the issue.

-----------------------

## Support homebridge-dolphin

**homebridge-dolphin** is a free plugin under the MIT license. it was developed as a contribution to the homebridge/hoobs community with lots of love and thoughts.
Creating and maintaining Homebridge plugins consume a lot of time and effort and if you would like to share your appreciation, feel free to "Star" or donate. 

<a target="blank" href="https://www.paypal.me/nitaybz"><img src="https://img.shields.io/badge/PayPal-Donate-blue.svg?logo=paypal"/></a><br>
<a target="blank" href="https://www.patreon.com/nitaybz"><img src="https://img.shields.io/badge/PATREON-Become a patron-red.svg?logo=patreon"/></a><br>
<a target="blank" href="https://ko-fi.com/nitaybz"><img src="https://img.shields.io/badge/Ko--Fi-Buy%20me%20a%20coffee-29abe0.svg?logo=ko-fi"/></a>