"""
failsafe.py — Fail-safe state machine for ESP32
Handles comm loss, sensor failures, and corrupted payloads.
"""

import utime
from config import PEER_TIMEOUT_S, NODE_ZONE
from sensor_reader import SensorReading


class SystemMode:
    NORMAL    = 'NORMAL'
    DEGRADED  = 'DEGRADED'
    ISOLATED  = 'ISOLATED'
    EMERGENCY = 'EMERGENCY'


class FailsafeManager:
    """
    Monitors system health and manages state transitions.

    State machine:
        NORMAL → DEGRADED → ISOLATED → EMERGENCY
                    ↕              ↕
                 NORMAL      NORMAL (peer reconnects)
    """

    def __init__(self, mesh_comm, led_controller):
        self.mesh  = mesh_comm
        self.leds  = led_controller
        self.mode  = SystemMode.NORMAL
        self._last_mode_change = utime.ticks_ms()
        self._emergency_zones  = set()

    def update(self, local_reading: SensorReading, peer_readings: dict) -> str:
        """
        Evaluate system state and update mode.
        Returns the current SystemMode string.
        """
        online_peers = self.mesh.get_online_peers()
        expected_peers = [nid for nid in [1, 2, 3] if nid != self.mesh.node_id]

        # ── Check local sensors for emergency ──────────────────
        if self._is_critical(local_reading):
            if self.mode != SystemMode.EMERGENCY:
                self._transition(SystemMode.EMERGENCY)
                self.mesh.broadcast_emergency()
            return self.mode

        # ── Check peer connectivity ────────────────────────────
        peers_lost = [p for p in expected_peers if p not in online_peers]

        if len(peers_lost) == len(expected_peers):
            # All peers lost
            if self.mode not in (SystemMode.ISOLATED, SystemMode.EMERGENCY):
                self._transition(SystemMode.ISOLATED)
        elif len(peers_lost) > 0:
            # Some peers lost
            if self.mode == SystemMode.NORMAL:
                self._transition(SystemMode.DEGRADED)
        else:
            # All peers online
            if self.mode in (SystemMode.DEGRADED, SystemMode.ISOLATED):
                self._transition(SystemMode.NORMAL)

        # ── Check peer emergency broadcasts ───────────────────
        for peer_id, data in peer_readings.items():
            if data.get('msg_type') == 0xFF:   # MSG_EMERGENCY
                if self.mode != SystemMode.EMERGENCY:
                    self._transition(SystemMode.EMERGENCY)

        self._update_leds()
        return self.mode

    def _is_critical(self, reading: SensorReading) -> bool:
        """True if local sensors indicate immediate danger."""
        return (
            reading.temperature > 80 or
            reading.smoke_ppm > 500 or
            reading.flame_detected
        )

    def _transition(self, new_mode: str):
        print(f'[Failsafe] {self.mode} → {new_mode}')
        self.mode = new_mode
        self._last_mode_change = utime.ticks_ms()

    def _update_leds(self):
        if self.mode == SystemMode.ISOLATED:
            self.leds.set_comm_lost()
        elif self.mode == SystemMode.EMERGENCY:
            self.leds.set_emergency()

    def should_use_fallback_path(self) -> bool:
        """In ISOLATED mode, use base-weight fallback path."""
        return self.mode in (SystemMode.ISOLATED, SystemMode.DEGRADED)

    def validate_sensor_reading(self, reading: SensorReading) -> bool:
        """
        Validate a reading for plausible sensor values.
        Returns False if values are out of physical range (sensor fault).
        """
        if reading.temperature < -40 or reading.temperature > 1000:
            print(f'[Failsafe] Implausible temperature: {reading.temperature}°C')
            return False
        if reading.smoke_ppm < 0 or reading.smoke_ppm > 10000:
            print(f'[Failsafe] Implausible smoke PPM: {reading.smoke_ppm}')
            return False
        return True

    def validate_mesh_message(self, msg: dict) -> bool:
        """
        Validate a received mesh message for corrupted / spoofed payloads.
        CRC was already checked in mesh_comm.unpack_message.
        """
        if msg is None:
            return False
        if msg.get('node_id') not in [1, 2, 3]:
            return False
        if msg.get('temperature', 0) < -40 or msg.get('temperature', 0) > 1000:
            print(f'[Failsafe] Peer message has implausible temperature')
            return False
        return True

    def get_status_dict(self) -> dict:
        return {
            'mode':         self.mode,
            'uptime_s':     utime.ticks_ms() // 1000,
            'last_change_s': utime.ticks_diff(utime.ticks_ms(), self._last_mode_change) // 1000,
            'online_peers':  self.mesh.get_online_peers(),
        }
