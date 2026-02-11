# ESP32 Home Energy Monitor v2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT) [![PlatformIO CI](https://img.shields.io/badge/PlatformIO-compatible-orange.svg)](https://platformio.org/) [![ESP32](https://img.shields.io/badge/ESP32-compatible-green.svg)](https://www.espressif.com/en/products/socs/esp32) [![AWS Lambda](https://img.shields.io/badge/AWS-Lambda-orange.svg)](https://aws.amazon.com/lambda/) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

A professional-grade wireless energy monitoring system built with ESP32 that measures current and power consumption across 3 independent circuits. Features **serverless AWS Lambda backend**, **MongoDB Atlas database**, **advanced energy analytics**, and a **modern React TypeScript dashboard**. Complete migration from Google Sheets to enterprise-level infrastructure.

![Dashboard Screenshot](screenshots/dashboard_screenshot.png)
_Modern React TypeScript interface with real-time monitoring and energy trend analysis_

## 🚀 Major v2.0 Features

### Core Monitoring
- **3-Phase Current Monitoring**: Simultaneous measurement of up to 3 circuits using CT sensors
- **Real-time Power Calculation**: Automatic power computation using configurable house voltage
- **12-bit ADC Resolution**: Enhanced precision with ESP32's 12-bit ADC capabilities
- **Configurable Sampling**: Adjustable measurement intervals and sample counts

### Serverless Backend Architecture
- **AWS Lambda Functions**: Scalable serverless data processing
- **MongoDB Atlas**: Professional NoSQL database with clustering
- **HTTP API Gateway**: RESTful endpoints for data retrieval and analytics
- **Cost-Efficient**: ~$0.005 per 1000 requests with 200ms response time

### Advanced Analytics & Trends
- **Energy Trend Analysis**: Historical consumption patterns using Python/pandas
- **Peak/Off-Peak Billing**: Configurable time-of-use rate calculations
- **Cost Analysis**: Real-time PKR billing with customizable rates
- **Weekday/Weekend Patterns**: Consumption analysis by day of week
- **Hourly Averages**: Peak usage hour identification
- **Export Capabilities**: Raw data export for external analysis

### Modern Frontend
- **React + TypeScript**: Type-safe, component-based architecture
- **Recharts Integration**: Interactive energy trend visualizations
- **Tailwind CSS**: Modern, responsive design system
- **Real-time Updates**: Live data streaming from Lambda functions
- **Mobile Responsive**: Optimized for all device sizes

### System Features
- **Automatic Compression**: Gzip compression for faster loading
- **OTA Updates**: Over-the-air firmware updates
- **Secure Authentication**: Token-based API access
- **Error Handling**: Comprehensive error management
- **Debug Mode**: Advanced logging and troubleshooting

## 📋 Hardware Requirements

### Essential Components
- **ESP32 Development Board** (any variant with ADC pins)
- **3x Current Transformers** (SCT-013-030 recommended)
- **3x Burden Resistors** (22-68Ω, depending on CT specifications)
- **Breadboard or PCB** for connections
- **5V Power Supply** (2A minimum recommended)

### Optional Components
- **Enclosure** for permanent installation
- **LED Indicators** for status feedback
- **Reset Button** for easy troubleshooting

## 🏗️ Architecture Overview

```
ESP32 Hardware → WiFi → AWS HTTP API → Lambda Functions → MongoDB Atlas → React Frontend
```

### Data Flow
1. **ESP32** measures current using CT sensors
2. **Data transmission** to AWS HTTP API via HTTP POST
3. **Lambda functions** process and store data in MongoDB
4. **React frontend** fetches analytics via HTTP API
5. **Real-time dashboard** displays trends and current status

## 🔌 Circuit Diagram

![Circuit Diagram](screenshots/circuit_diagram.jpg)
_Complete wiring diagram showing ESP32 connections to CT sensors_

### Pin Configuration

| ESP32 Pin         | Function        | Connection                    |
| ----------------- | --------------- | ----------------------------- |
| GPIO34 (ADC1_CH6) | Phase 1 Current | CT Sensor 1 + Burden Resistor |
| GPIO36 (ADC1_CH0) | Phase 2 Current | CT Sensor 2 + Burden Resistor |
| GPIO39 (ADC1_CH3) | Phase 3 Current | CT Sensor 3 + Burden Resistor |
| 3.3V              | Power           | CT Sensors Common             |
| GND               | Ground          | Circuit Ground                |

## 🛠️ Installation

### Prerequisites
- [PlatformIO](https://platformio.org/) installed in VS Code
- [Node.js](https://nodejs.org/) (v16+ for frontend)
- [Docker](https://www.docker.com/) for building Lambda layers
- [MongoDB Atlas](https://www.mongodb.com/atlas) account
- AWS Account with Lambda and HTTP API access
- Git for version control

### Step 1: Clone Repository
```bash
git clone https://github.com/asimajeed/ESP32-Energy-Monitor.git
cd ESP32-Power-Monitor
```

### Step 2: Build AWS Lambda Layers

Lambda functions require custom layers for dependencies. You need to build these layers using Docker to ensure compatibility with the AWS Lambda runtime.

#### Build Node.js Layer
```bash
cd Lambda-API/node-layer
docker compose run --build app
```

This will:
- Start an Amazon Linux 2023 container
- Run `npm install` to install dependencies from `package.json`
- Create a deployable layer zip file

#### Build Python Layer
```bash
cd Lambda-API/python-layer
docker compose run --build app
```

This will:
- Start an Amazon Linux 2023 container
- Run `pip install -r requirements.txt` to install Python dependencies
- Create a deployable layer zip file

### Step 3: AWS Lambda Setup

#### Create Lambda Functions via AWS Console

1. **Navigate to AWS Lambda Console**
2. **Create the following functions:**

| Function Name | Runtime | Handler | Description |
|---------------|---------|---------|-------------|
| `power-meter-post` | Node.js 22.x | `postReadings.handler` | Store ESP32 data |
| `power-meter-get` | Node.js 22.x | `getData.handler` | Export raw data |
| `power-meter-trends` | Python 3.13 | `getTrends.handler` | Analytics & trends |
| `power-meter-auth` | Node.js 22.x | `authFunc.handler` | Authentication |

3. **Upload Function Code:**
   - For each function, upload the corresponding file from `Lambda-API/functions/`
   - Attach the appropriate layer (Node.js or Python) to each function

4. **Configure Environment Variables:** (.env must be placed along with every function using it seperately.)
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   ACCESS_TOKEN=your-secret-token
   ```

#### Set up HTTP API Gateway

1. **Create HTTP API:**
   - Go to AWS API Gateway console
   - Create a new HTTP API
   - Configure CORS settings for your frontend domain (add `*` to all)

2. **Create Routes:**
   ```
   POST /updload → power-meter-upload
   GET /data → power-meter-get
   GET /trends → power-meter-trends
   ```

3. **Configure Authorizer:**
   - Set up Lambda authorizer using `power-meter-auth`
   - Apply to all routes

4. **Deploy API:**
   - Deploy to a stage (e.g., `prod`)
   - Note the API Gateway URL for configuration

### Step 4: MongoDB Atlas Setup

1. **Create MongoDB Atlas Cluster:**
   - Sign up for MongoDB Atlas
   - Create a new cluster
   - Create a database user with read/write permissions

2. **Configure Network Access:**
   - Add `0.0.0.0/0` to IP whitelist (for Lambda functions)
   - Or configure VPC peering for better security (complicated + costs more)

3. **Get Connection String:**
   - Copy the connection string for use in Lambda environment variables

### Step 5: Frontend Configuration

1. **Install Dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your settings:
   ```
   VITE_API_URL=https://your-api-gateway-id.execute-api.region.amazonaws.com/prod
   VITE_ACCESS_TOKEN=your-secret-token
   ```

3. **Build Frontend:**
   ```bash
   npm run build
   ```

### Step 6: ESP32 Firmware Setup

1. **Configure Project:**
   ```bash
   cd firmware
   cp src/config.example.h src/config.h
   ```

2. **Edit `src/config.h`:**
   ```cpp
   #define SCRIPT_LINK "https://your-api-gateway-id.execute-api.region.amazonaws.com/prod"
   #define API_SECRET "your-secret-token"
   ```

3. **Build and Upload:**
   - Use PlatformIO to build and upload firmware
   - Monitor serial output for connection status

## 📁 Project Structure

```
.
├── Lambda-API/
│   ├── functions/              # Lambda function source code
│   │   ├── authFunc.js
│   │   ├── getData.js
│   │   ├── getTrends.py
│   │   └── postReadings.js
│   ├── node-layer/             # Node.js dependencies layer
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── nodejs/
│   │       ├── package.json
│   │       └── utils.js
│   └── python-layer/           # Python dependencies layer
│       ├── Dockerfile
│       ├── docker-compose.yml
│       ├── python/
│       │   ├── main.py
│       │   └── utils.py
│       └── requirements.txt
├── firmware/                   # ESP32 firmware
│   ├── src/
│   │   ├── config.example.h
│   │   └── main.cpp
│   ├── lib/
│   │   └── EmonLib-esp32-master/
│   └── platformio.ini
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.ts
├── frontend_html_version/      # Legacy HTML version (Not updated)
├── screenshots/                # Project screenshots
└── SheetsDataCleaning.ipynb    # Sheets Data cleaning
```

## 🖥️ Modern Web Interface

### Dashboard Features
- **Real-time Current Display**: Live IRMS values for all three phases
- **Power Calculation**: Automatic power computation with configurable voltage
- **Energy Trends**: Interactive charts showing consumption patterns
- **Cost Analysis**: Real-time billing calculations with peak/off-peak rates
- **System Status**: Connection status and last update time

### Analytics Panel
- **Energy Trends**: Historical consumption using Recharts
- **Peak Usage Analysis**: Identify highest consumption periods
- **Cost Breakdown**: Peak vs off-peak billing analysis
- **Weekday Patterns**: Consumption analysis by day of week
- **Export Data**: Raw data export for external analysis

### Settings Management
- **House Voltage**: Configure your local voltage (default: 230V)
- **Calibration Values**: Individual calibration for each CT sensor
- **Billing Rates**: Configure peak/off-peak electricity rates
- **Time-of-Use**: Set peak hour schedules
- **Logging Configuration**: Measurement and logging intervals

## 📊 AWS Lambda Functions

### Function Overview

| Function | Runtime | Purpose | Avg. Memory | Avg. Duration |
|----------|---------|---------|-------------|---------------|
| `postReadings.js` | Node.js 22.x | Store ESP32 data | 128MB | 200ms |
| `getData.js` | Node.js 22.x | Export raw data | 128MB | >3000ms |
| `getTrends.py` | Python 3.13 | Analytics & trends | 128MB | >12000ms |
| `authFunc.js` | Node.js 22.x | Authentication | 128MB | 50ms |

### Cost Analysis
- **Monthly Cost**: ~$0.00533
- **Scalability**: Auto-scalable
- **Performance**: 200ms average response time
- **Reliability**: 99.9% uptime with AWS infrastructure

## 🗄️ Database Schema

### MongoDB Collections

**`readings` Collection:**
```json
{
  "_id": ObjectId,
  "Time": ISODate,
  "IRMS1": Number,
  "IRMS2": Number,
  "IRMS3": Number,
  "device_id": String
}
```

## 📈 Energy Analytics

### Trend Analysis Features
- **Peak/Off-Peak Billing**: Configurable time-of-use rates
- **Daily/Weekly Patterns**: Consumption analysis by time periods
- **Cost Optimization**: Identify opportunities to reduce bills
- **Historical Comparison**: Month-over-month analysis
- **Export Capabilities**: CSV export for external analysis

### Billing Calculations
```python
# Example peak/off-peak calculation
peak_hours = "18:30-22:30"
base_rate = 35  # PKR per kWh
peak_rate = 40  # PKR per kWh
power_factor = 0.9
voltage = 230V
```

## 🔧 Advanced Configuration

### Lambda Layer Dependencies
- **Node.js Layer**: Common utilities and MongoDB client
- **Python Layer**: pandas, numpy for analytics
- **Docker Support**: Containerized layer creation for consistency and reliability

### Building Custom Layers
The project uses Docker to ensure Lambda layers are built in an environment identical to AWS Lambda runtime (Amazon Linux 2023). This prevents compatibility issues that can occur when building layers locally.

## 🚨 Troubleshooting

### Common Issues

**Docker Build Issues:**
- Ensure Docker is installed and running
- Check that Docker Compose is available
- Verify network connectivity for package downloads

**Lambda Function Errors:**
- Check CloudWatch logs for detailed error messages
- Verify MongoDB connection strings
- Ensure HTTP API is configured with proper CORS settings
- Confirm IAM permissions for Lambda execution

**ESP32 Connection Problems:**
- Verify WiFi credentials in `config.h`
- Check API endpoint URL format
- Monitor serial output for HTTP response codes
- Ensure ACCESS_TOKEN matches Lambda configuration

**MongoDB Connection Issues:**
- Verify Atlas cluster network access settings
- Check connection string format and credentials
- Ensure database user has proper permissions
- Test connection from Lambda function logs

## 📈 Performance Specifications

- **Measurement Range**: 0-80A per channel (with SCT-013-100)
- **Accuracy**: ±2% with proper calibration
- **Sample Rate**: ~1480 samples per measurement
- **Database Performance**: <200ms query response time
- **Frontend Load Time**: <2 seconds (with gzip compression)
- **API Response Time**: 150-250ms average

## Checkout v1.0

> **Note**: The older Google Sheets-based version (v1.0) is available in the `old-sheets-version`

### Key Improvements
- **Database**: Google Sheets → MongoDB Atlas
- **Backend**: Direct HTTP → AWS Lambda Functions
- **Frontend**: HTML/JS → React TypeScript
- **Analytics**: Basic logging → Advanced trend analysis
- **Billing**: Manual calculation → Automated peak/off-peak
- **Scalability**: Single device → Multi-device ready

### Accessing v1.0 (Google Sheets Version)
```bash
git checkout old-sheets-version
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📄 License

This project is licensed under the GNU General Public License v3.0

## 🙏 Acknowledgments

- **[Savjee](https://github.com/Savjee/EmonLib-esp32)**: ESP32 energy monitoring inspiration
- **OpenEnergyMonitor**: Original EmonLib concepts
- **AWS Community**: Extensive online troubleshooting
- **React Community**: Modern frontend development (ShadCN UI)

---

**v2.0 Release Notes:**
- Complete serverless architecture migration
- Advanced energy analytics and trend analysis
- Modern React TypeScript frontend
- AWS Lambda backend with MongoDB Atlas
- Automated billing with peak/off-peak rates
- Professional-grade performance and scalability
- Docker-based layer building for AWS Lambda
- HTTP API Gateway integration