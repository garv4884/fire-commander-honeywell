# Firmware - Fire Commander

This directory contains the Python hardware layer meant to run on the physical edge devices (e.g., ESP32, Raspberry Pi, Arduino) scattered throughout the building.

## Purpose
Each physical hardware node is responsible for:
1. **Sensing**: Reading local temperature, smoke particulate (ppm), and flame sensors.
2. **Displaying**: Controlling the physical "Smart Sign" (LED matrices/LCDs) pointing occupants to safety.
3. **Communicating**: Pushing telemetry up to the central Dashboard server and receiving back the latest safest path vector.

## Architecture

- `main.py` - The entry point for the node.
- `sensor_reader.py` - Interfaces with physical GPIO/I2C sensors (or simulates them).
- `sensor_fusion.py` - Local evaluation logic that converts raw sensor data into a simplified "Hazard Level" constraint.
- `led_controller.py` - Responsible for rendering the directional arrows based on the path vector received from the dashboard.
- `mesh_comm.py` - Network layer for publishing state and subscribing to central commands.

## Running Locally (Simulation)
Currently, this is configured for rapid prototyping and simulation without requiring actual GPIO pins. It uses standard Python 3.

```bash
python main.py
```
This will spin up simulated sensor reads and output the smart sign directions to the console.
