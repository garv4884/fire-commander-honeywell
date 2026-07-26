"""
sensor_reader.py — Abstract sensor interface for ESP32
Supports real hardware (DHT22, MQ-2, IR Flame) and simulation mode.
"""

import time
import ujson
import machine

try:
    import dht
    DHT_AVAILABLE = True
except ImportError:
    DHT_AVAILABLE = False

from config import (
    DHT_PIN, SMOKE_ADC, FLAME_PIN, BUZZER_PIN,
    MQ2_R0, MQ2_CLEAN_AIR_FACTOR, SIMULATION_MODE, NODE_ZONE
)


class SensorReading:
    """Represents a snapshot of all sensor values at one point in time."""
    __slots__ = ('node_id', 'timestamp', 'temperature', 'smoke_ppm',
                 'flame_detected', 'occupancy', 'is_simulated')

    def __init__(self, node_id, temperature=25.0, smoke_ppm=0,
                 flame_detected=False, occupancy=0, is_simulated=False):
        self.node_id       = node_id
        self.timestamp     = time.ticks_ms()
        self.temperature   = temperature
        self.smoke_ppm     = smoke_ppm
        self.flame_detected= flame_detected
        self.occupancy     = occupancy
        self.is_simulated  = is_simulated

    def to_dict(self):
        return {
            'nodeId':        self.node_id,
            'timestamp':     self.timestamp,
            'temperature':   round(self.temperature, 1),
            'smokePpm':      self.smoke_ppm,
            'flameDetected': self.flame_detected,
            'occupancy':     self.occupancy,
            'isSimulated':   self.is_simulated,
        }

    def to_bytes(self):
        """Compact 10-byte binary representation for ESP-NOW."""
        import ustruct
        temp_int  = int(self.temperature * 10)   # e.g. 256 = 25.6°C
        smoke_int = int(self.smoke_ppm)
        flame_int = 1 if self.flame_detected else 0
        occ_int   = min(255, self.occupancy)
        # Format: temp(2) smoke(2) flame(1) occ(1) = 6 bytes + 4 padding
        return ustruct.pack('>hHBB', temp_int, smoke_int, flame_int, occ_int)

    @classmethod
    def from_dict(cls, d):
        r = cls(d['nodeId'])
        r.timestamp      = d.get('timestamp', time.ticks_ms())
        r.temperature    = d.get('temperature', 25.0)
        r.smoke_ppm      = d.get('smokePpm', 0)
        r.flame_detected = d.get('flameDetected', False)
        r.occupancy      = d.get('occupancy', 0)
        r.is_simulated   = d.get('isSimulated', False)
        return r


class SensorReader:
    """
    Reads all sensors and returns a SensorReading.
    Falls back to simulation values if hardware is unavailable.
    """

    def __init__(self, node_id, zone_id):
        self.node_id  = node_id
        self.zone_id  = zone_id
        self._sim_val = None   # Injected simulation override

        # Init DHT22
        if DHT_AVAILABLE and not SIMULATION_MODE:
            try:
                self._dht = dht.DHT22(machine.Pin(DHT_PIN))
                self._dht_ok = True
                print(f'[Sensor] DHT22 on pin {DHT_PIN} OK')
            except Exception as e:
                print(f'[Sensor] DHT22 init failed: {e}')
                self._dht_ok = False
        else:
            self._dht_ok = False

        # Init ADC for MQ-2
        if not SIMULATION_MODE:
            try:
                self._adc = machine.ADC(machine.Pin(SMOKE_ADC))
                self._adc.atten(machine.ADC.ATTN_11DB)   # 0-3.6V range
                self._adc_ok = True
                print(f'[Sensor] MQ-2 ADC on pin {SMOKE_ADC} OK')
            except Exception as e:
                print(f'[Sensor] ADC init failed: {e}')
                self._adc_ok = False
        else:
            self._adc_ok = False

        # Init flame sensor (digital input, active LOW)
        if not SIMULATION_MODE:
            try:
                self._flame_pin = machine.Pin(FLAME_PIN, machine.Pin.IN, machine.Pin.PULL_UP)
                self._flame_ok  = True
                print(f'[Sensor] Flame sensor on pin {FLAME_PIN} OK')
            except Exception as e:
                print(f'[Sensor] Flame pin init failed: {e}')
                self._flame_ok = False
        else:
            self._flame_ok = False

        self._last_reading = SensorReading(node_id)

    def inject_simulation(self, values: dict):
        """Accept injected simulation values (from Serial/MQTT)."""
        self._sim_val = values

    def clear_simulation(self):
        self._sim_val = None

    def read(self) -> SensorReading:
        """Read all sensors and return a SensorReading."""
        if SIMULATION_MODE and self._sim_val is not None:
            r = SensorReading(
                self.node_id,
                temperature   = self._sim_val.get('temperature', 25.0),
                smoke_ppm     = self._sim_val.get('smokePpm', 0),
                flame_detected= self._sim_val.get('flameDetected', False),
                occupancy     = self._sim_val.get('occupancy', 0),
                is_simulated  = True,
            )
            self._last_reading = r
            return r

        temp         = self._read_temperature()
        smoke        = self._read_smoke()
        flame        = self._read_flame()
        occ          = 0  # Occupancy: would be from access control API

        r = SensorReading(self.node_id, temp, smoke, flame, occ, is_simulated=SIMULATION_MODE)
        self._last_reading = r
        return r

    def _read_temperature(self) -> float:
        if not self._dht_ok:
            return self._last_reading.temperature  # Last known value
        try:
            self._dht.measure()
            return self._dht.temperature()
        except Exception as e:
            print(f'[Sensor] DHT22 read error: {e}')
            return self._last_reading.temperature

    def _read_smoke(self) -> int:
        """Convert ADC reading to approximate PPM via MQ-2 Rs/R0 ratio."""
        if not self._adc_ok:
            return self._last_reading.smoke_ppm
        try:
            raw   = self._adc.read()   # 0-4095
            volt  = raw / 4095.0 * 3.3
            if volt < 0.01:
                return 0
            rs    = (3.3 - volt) / volt * 10.0  # kΩ (RL=10kΩ)
            ratio = rs / MQ2_R0
            # Approximate: PPM ≈ 1000 / ratio (simplified curve)
            ppm   = max(0, int(1000.0 / max(ratio, 0.01)))
            return min(ppm, 9999)
        except Exception as e:
            print(f'[Sensor] ADC read error: {e}')
            return self._last_reading.smoke_ppm

    def _read_flame(self) -> bool:
        if not self._flame_ok:
            return False
        try:
            return self._flame_pin.value() == 0  # Active LOW
        except Exception as e:
            print(f'[Sensor] Flame read error: {e}')
            return False
