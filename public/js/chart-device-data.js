/* eslint-disable max-classes-per-file */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

$(document).ready(() => {
  // if deployed to a site supporting SSL, use wss://
  const protocol = document.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
  const webSocket = new WebSocket(protocol + location.host);
  console.log("hola");

  // A class for holding the last N points of telemetry for a device
  // FINAL ASSIGNMENT: we do not need any array, as we only need to print the last value received
  // FINAL ASSIGNMENT: lat & long in the map, and distance & speed in the labels
  class DeviceData {
    constructor(deviceId) {
      this.deviceId = deviceId;
      this.timeData = null;
      this.distance = null;
      this.speed = null;
      this.latitude = 40.388461795407444;
      this.longitude = -3.6298768772729666;
      this.accelerationGs = null;
      this.engineRpm = null;
      this.lateralGs = null;
      this.steeringAngle = null;
    }

    // FINAL ASSIGNMENT: this method add the elements to the arrays. In our case, it is easier, as we do 
    // not need to append elements, only overwrite them
    addData(t, dist, sp, lat, long, accelG, rpm, latG, sa) {
      this.time = t;
      this.distance = dist;
      this.speed = sp;
      this.latitude = lat;
      this.longitude = long;
      this.accelerationGs = accelG;
      this.engineRpm = rpm;
      this.lateralGs = latG;
      this.steeringAngle = sa;
    }
  }

  // All the devices in the list (those that have been sending telemetry)
  // FINAL ASSIGNMENT: it is the same for our case, so we do not need to change anything here
  class TrackedDevices {
    constructor() {
      this.devices = [];
    }

    // Find a device based on its Id
    findDevice(deviceId) {
      for (let i = 0; i < this.devices.length; ++i) {
        if (this.devices[i].deviceId === deviceId) {
          return this.devices[i];
        }
      }

      return undefined;
    }

    getDevicesCount() {
      return this.devices.length;
    }
  }

  const trackedDevices = new TrackedDevices();

  // Define the chart axes
  // FINAL ASSIGNMENT: we do not need any chart, only the map and two labels for the distance and speed

  // Get the context of the canvas element we want to select
  // FINAL ASSIGNMENT: as we do not use chart, we do not need this part of code
  // FINAL ASSIGNMENT: only obtain the ids of the HTML file and update with the current values  

  // Manage a list of devices in the UI, and update which device data the chart is showing
  // based on selection
  // FINAL ASSIGNMENT: let this part as it is, as we need to manage different devices
  let needsAutoSelect = true;
  const deviceCount = document.getElementById('deviceCount');
  const listOfDevices = document.getElementById('listOfDevices');

  const mapLayout = document.getElementById('map');
  const distanceLabel = document.getElementById('distance');
  const speedLabel = document.getElementById('speed');
  const accelerationGsLabel = document.getElementById('accelG');
  const engineRpmLabel = document.getElementById('rpm');
  const lateralGsLabel = document.getElementById('latG');
  const steeringAngleLabel = document.getElementById('sa');
  
  function updateLocation(lat, long, map) {
    var location = {lat: lat, lng: long};
    console.log(location);
    var map = new google.maps.Map(document.getElementById("map"), {
        zoom: 15,
        center: location
    });
    var marker = new google.maps.Marker({
      map: map,
      position: location
    });
  }

  function OnSelectionChange() {
    const device = trackedDevices.findDevice(listOfDevices[listOfDevices.selectedIndex].text);
    distanceLabel.innerHTML = "Distance covered: " + device.distance + " Miles";
    speedLabel.innerHTML = "Current speed: " + device.speed + " MPH";
    accelerationGsLabel.innerHTML = "Acceleration Gs: " + device.accelerationGs + " G";
    lateralGsLabel.innerHTML = "Lateral Gs: " + device.lateralGs + " G";
    engineRpmLabel.innerHTML = "Engine RPM: " + device.engineRpm + " RPM";
    steeringAngleLabel.innerHTML = "Steering angle: " + device.steeringAngle + "º";
    updateLocation(device.latitude, device.longitude, mapLayout);
  }
  listOfDevices.addEventListener('change', OnSelectionChange, false);

  // When a web socket message arrives:
  // 1. Unpack it
  // 2. Validate it has date/time and temperature
  // 3. Find or create a cached device to hold the telemetry data
  // 4. Append the telemetry data
  // 5. Update the chart UI
  // FINAL ASSIGNMENT: similar to that code: unpack the code, validate it has the 4 variables (lat, long, distance and speed),
  // FINAL ASSIGNMENT: hold the telemetry data, append it and update the HTML elements (map and labels)
  webSocket.onmessage = function onMessage(message) {
    try {
      const messageData = JSON.parse(message.data);
      console.log(messageData);

      // time and either temperature or humidity are required
      if (!messageData.MessageDate || (!messageData.IotData.distance && !messageData.IotData.speed && !messageData.IotData.latitude && !messageData.IotData.longitude && !messageData.IotData.accelerationGs && !messageData.IotData.engineRpm && !messageData.IotData.lateralGs && !messageData.IotData.steeringAngle)) {
        return;
      }

      // find or add device to list of tracked devices
      const existingDeviceData = trackedDevices.findDevice(messageData.DeviceId);

      if (existingDeviceData) {
        existingDeviceData.addData(messageData.MessageDate, messageData.IotData.distance, messageData.IotData.speed, messageData.IotData.latitude, messageData.IotData.longitude, messageData.IotData.accelerationGs, messageData.IotData.engineRpm, messageData.IotData.lateralGs, messageData.IotData.steeringAngle);
      } else {
        const newDeviceData = new DeviceData(messageData.DeviceId);
        trackedDevices.devices.push(newDeviceData);
        const numDevices = trackedDevices.getDevicesCount();
        deviceCount.innerText = numDevices === 1 ? `${numDevices} device` : `${numDevices} devices`;
        newDeviceData.addData(messageData.MessageDate, messageData.IotData.distance, messageData.IotData.speed, messageData.IotData.latitude, messageData.IotData.longitude, messageData.IotData.accelerationGs, messageData.IotData.engineRpm, messageData.IotData.lateralGs, messageData.IotData.steeringAngle);

        // add device to the UI list
        const node = document.createElement('option');
        const nodeText = document.createTextNode(messageData.DeviceId);
        node.appendChild(nodeText);
        listOfDevices.appendChild(node);

        // if this is the first device being discovered, auto-select it
        if (needsAutoSelect) {
          needsAutoSelect = false;
          listOfDevices.selectedIndex = 0;
          OnSelectionChange();
        }
      }
      OnSelectionChange();
    } catch (err) {
      console.error(err);
    }
  };
});

