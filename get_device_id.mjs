import { cloudLogin, listDevicesByType } from 'tp-link-tapo-connect';
import {config} from 'dotenv';
config();

console.log(`Logging in to TP-Link cloud...`);
const cloudToken = await cloudLogin(process.env.TAPO_EMAIL, process.env.TAPO_PASSWORD);
console.log(`Cloud token obtained, looking for device`)
const devices = await listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
console.log(`\n`);
console.log(`Found ${devices.length} devices`)
console.log(devices.map(device => `${device.deviceName} ${device.alias} - Device ID ${device.deviceId}`).join('\n'));
console.log(`\n`);
console.log(`You must set the TAPO_DEVICE_ID environment variable to the ID of the device you want to control`);
console.log(`For example, if the Device ID is CXPEKEXQKKSHPCPYFKLNCN, you'd use TAPO_DEVICE_ID="CXPEKEXQKKSHPCPYFKLNCN" in .env.`)
console.log(`Do not include spaces or the "Device ID" text, just the ID itself.`)