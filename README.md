# offline-server-auto-restart

Have you tried turning it off and on again? Offline Server Auto Restart uses a Raspberry Pi and Tapo P100 (or P105) smart plug to automatically power cycle a server that unexpectedly went down.

## Requirements

- Tapo P100 or P105 smart plug connected to your server as well as to your network
- Node.js and npm installed
- Any open port on the server (could be SSH, HTTP, etc.)
- Raspberry Pi or similar second computer that is always on and connected to the same network as the smart plug and server

### Nice to have

- BIOS settings configured to turn on the server when power is restored

## Usage

1. Clone this repository to your Raspberry Pi
2. Run `npm install` to install dependencies
3. Copy `.env.example` to `.env` and fill in the required values
4. Run `node get_device_id.mjs` to get the device ID of your smart plug
5. Copy the device ID to the `.env` file
6. Run `node index.mjs` to start the script. Preferably, use a process manager like [PM2](https://pm2.keymetrics.io/) to keep the script running in the background and to automatically restart it if it crashes.

## Why not ping?

Some servers respond to ping requests even if they are turned off (for example, devices with Intel AMT configured or servers with Wake-on-LAN enabled). This script checks the ports to see if the server is running.

## Important

- There is a chance that the checked port will be closed during a graceful shutdown or reboot. In that case, the script will assume that the server is down and will power cycle it. This could result in **data loss**.
- Servers rebooting into the BIOS or UEFI setup will not be detected as running and will be power cycled.
