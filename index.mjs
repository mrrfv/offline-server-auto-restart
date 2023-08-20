import { cloudLogin, listDevicesByType, loginDevice, turnOff, turnOn } from 'tp-link-tapo-connect';
import { config } from 'dotenv';
import { check } from 'tcp-port-used';
import { Webhook } from 'webhook-discord';
import { wake } from 'wol';
config();

// Discord webhook name
const webhook_name = 'Offline Server Auto Restart';

// Verify that process.env.CHECK_OPEN_PORT is a valid port
if (isNaN(Number(process.env.CHECK_OPEN_PORT))) {
    console.error(`CHECK_OPEN_PORT must be a valid port number. You provided ${process.env.CHECK_OPEN_PORT}`);
    process.exit(1);
}
const port_to_check = Number(process.env.CHECK_OPEN_PORT);

// Setup Discord webhook
let Hook = false;
if (process.env.DISCORD_WEBHOOK_URL) {
    console.log(`Discord webhook URL provided, will send notifications to Discord`);
    Hook = new Webhook(process.env.DISCORD_WEBHOOK_URL);
    Hook.success(webhook_name, `Server monitor started.`);
} else {
    console.log(`No Discord webhook URL provided, will not send notifications to Discord`);
}

async function main() {
    try {
        console.log(`Checking if port ${port_to_check} is open...`)
        let port_open = false;
        try {
            port_open = await check(port_to_check, process.env.SERVER_ADDRESS);
        } catch(e) {
            // If the port is closed, tcp-port-used throws an error. We don't care about the error, so we're just catching it and ignoring it.
            console.log(`Error: ${e} - assuming the server is down.`)
        }
        console.log(`Port ${port_to_check} is ${port_open ? 'open' : 'closed'}`)

        if (port_open) {
            console.log(`Server appears to be online, not doing anything.`)
        } else {
            // Send a warning message to Discord
            if (Hook) Hook.warn(webhook_name, `Server appears to be offline, restarting...`);
            console.log(`Restarting server...`)
            console.log(`Logging in to TP-Link cloud...`);
            const cloudToken = await cloudLogin(process.env.TAPO_EMAIL, process.env.TAPO_PASSWORD);
            console.log(`Cloud token obtained, looking for device`)
            const devices = await listDevicesByType(cloudToken, 'SMART.TAPOPLUG');
            console.log(`Found ${devices.length} devices`)
            const device = devices.find(device => device.deviceId === process.env.TAPO_DEVICE_ID);
            if (!device) return console.error(`Couldn't find your device ID in the list of devices. Please check your TAPO_DEVICE_ID environment variable.`);
            console.log(`Getting device token...`);
            const deviceToken = await loginDevice(process.env.TAPO_EMAIL, process.env.TAPO_PASSWORD, device);
            // Power cycle the device using the smart plug
            console.log(`Device token obtained, restarting device...`);
            await turnOff(deviceToken);
            console.log(`Device turned off, waiting 25 seconds...`);
            await new Promise(resolve => setTimeout(resolve, 25 * 1000));
            await turnOn(deviceToken);
            // Send a success message to Discord
            if (Hook) Hook.success(webhook_name, `Server restarted. Please see the logs for details.`);
            console.log(`Device turned on!`);
            console.log(`Waiting 8 seconds before sending wake-on-lan packet...`);
            await new Promise(resolve => setTimeout(resolve, 8 * 1000));
            console.log(`Sending wake-on-lan packet...`);
            wake(process.env.SERVER_MAC_ADDRESS, (err, res) => {
                if (err) {
                    console.error(`Error sending wake-on-lan packet: ${err}`);
                    if (Hook) Hook.err(webhook_name, `An error occurred while sending the wake-on-lan packet, please check the logs.`);
                }
                console.log(`Wake-on-lan packet sent!`);
            });
            console.log(`Sleeping for 8 minutes to give the server time to start...`);
            await new Promise(resolve => setTimeout(resolve, 8 * 60 * 1000));
        }
    } catch(e) {
        if (Hook) Hook.err(webhook_name, `An error occurred while running the script, please check the logs.`);
        console.error(`An error occurred: ${e}`);
    }

    // Check again in 6 minutes. We're using setTimeout instead of setInterval to avoid race conditions
    console.log(`Checking again in 6 minutes.`)
    setTimeout(main, 6 * 60 * 1000);
}

main();
