const powerValue1 = document.getElementById('powerValue1');
const irmsValue1 = document.getElementById('irmsValue1');
const powerValue2 = document.getElementById('powerValue2');
const irmsValue2 = document.getElementById('irmsValue2');
const powerValue3 = document.getElementById('powerValue3');
const irmsValue3 = document.getElementById('irmsValue3');
const houseVoltage = document.getElementById('houseVoltage');
const calibrationVal1 = document.getElementById('calibrationVal1');
const calibrationVal2 = document.getElementById('calibrationVal2');
const calibrationVal3 = document.getElementById('calibrationVal3');
const numMeasurements = document.getElementById('numMeasurements');
const interval = document.getElementById('interval');
const otaForm = document.getElementById('otaForm');
const otaStatus = document.getElementById('otaStatus');
const resetWifiButton = document.getElementById('resetWifiButton');
const restartButton = document.getElementById("restartButton");
const resetStatus = document.getElementById('resetStatus');
const settingsForm = document.getElementById('settingsForm');
const settingsStatus = document.getElementById('settingsStatus');
let voltageToUse = 0;

// Fetch data from /status endpoint and update content
function updateStatus() {
  fetch('/status')
    .then(response => response.json())
    .then(data => {
      irmsValue1.textContent = data.irms1;
      irmsValue2.textContent = data.irms2;
      irmsValue3.textContent = data.irms3;
      powerValue1.textContent = (data.irms1 * voltageToUse).toFixed(0);
      powerValue2.textContent = (data.irms2 * voltageToUse).toFixed(0);
      powerValue3.textContent = (data.irms3 * voltageToUse).toFixed(0);
    })
    .catch(error => console.error('Error fetching status:', error));
}

// Fetch data from /settings endpoint and update content
function updateSettingsDisplay() {
  fetch('/settings')
    .then(response => response.json())
    .then(data => {
      houseVoltage.value = data.hV;
      voltageToUse = data.hV;
      calibrationVal1.value = data.cV1;
      calibrationVal2.value = data.cV2;
      calibrationVal3.value = data.cV3;
      numMeasurements.value = data.numms;
      interval.value = data.interval;
    })
    .catch(error => console.error('Error fetching settings:', error));
}

// Initial status update
updateStatus();
updateSettingsDisplay();

// Update status every 1 seconds
setInterval(updateStatus, 1000);

// Handle OTA form submission
otaForm.addEventListener('submit', function (event) {
  event.preventDefault();
  otaStatus.textContent = "Attempting update please wait.";
  const formData = new FormData(otaForm);
  fetch('/update', {
    method: 'POST',
    body: formData
  })
    .then(response => response.text())
    .then(result => {
      otaStatus.textContent = result;
      setTimeout(() => location.reload(true), 3000);
    })
    .catch(error => {
      otaStatus.textContent = 'OTA Update Failed';
      console.error('Error updating firmware:', error);
    });
});

// Handle reset WiFi button click
resetWifiButton.addEventListener('click', function () {
  fetch('/reset-wifi', { method: 'POST' })
    .then(response => response.text())
    .then(result => {
      resetStatus.textContent = result;
    })
    .catch(error => {
      resetStatus.textContent = 'Reset Failed';
      console.error('Error resetting WiFi:', error);
    });
});

restartButton.addEventListener('click', function () {
  fetch('/restart', { method: 'POST' })
    .then(response => response.text())
    .then(result => {
      resetStatus.textContent = result;
      setTimeout(() => location.reload(true), 10000);
    })
    .catch(error => {
      resetStatus.textContent = 'Restart failed';
      console.error('Error resetting Wifi:', error);
    })
})
// Handle settings form submission
settingsForm.addEventListener('submit', function (event) {
  event.preventDefault();

  const formData = new FormData(settingsForm);
  const houseVoltage = formData.get('houseVoltage');
  const calibrationVal1 = formData.get('calibrationVal1');
  const calibrationVal2 = formData.get('calibrationVal2');
  const calibrationVal3 = formData.get('calibrationVal3');
  const numMeasurements = formData.get('numMeasurements');
  const interval = formData.get('interval');

  fetch('/update-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `houseVoltage=${houseVoltage}&calibrationVal1=${calibrationVal1}&calibrationVal2=${calibrationVal2}&calibrationVal3=${calibrationVal3}&numMeasurements=${numMeasurements}&interval=${interval}`
  })
    .then(response => response.text())
    .then(result => {
      settingsStatus.textContent = result;
      setTimeout(() => location.reload(true), 10000);
    })
    .catch(error => {
      settingsStatus.textContent = 'Update Failed';
      console.error('Error updating settings:', error);
    });
});