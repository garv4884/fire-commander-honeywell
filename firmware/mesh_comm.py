"""
mesh_comm.py — ESP-NOW mesh communication for ESP32
12-byte binary protocol with CRC-16 validation.
"""

import struct
import utime
import network

try:
    import espnow
    ESPNOW_AVAILABLE = True
except ImportError:
    ESPNOW_AVAILABLE = False
    print('[Mesh] ESP-NOW not available — running in simulation mode')

from config import NODE_ID, PEERS, HEARTBEAT_INTERVAL_S, PEER_TIMEOUT_S

# ─── Message Types ────────────────────────────────────────────
MSG_SENSOR    = 0x01
MSG_PATH      = 0x02
MSG_HEARTBEAT = 0x03
MSG_EMERGENCY = 0xFF

# ─── CRC-16/CCITT ────────────────────────────────────────────
def _crc16(data: bytes) -> int:
    crc = 0xFFFF
    for b in data:
        crc ^= b << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
        crc &= 0xFFFF
    return crc


# ─── Payload Packing / Unpacking ─────────────────────────────
# Wire format (12 bytes):
#   [0]   MSG_TYPE    uint8
#   [1]   NODE_ID     uint8
#   [2-3] SEQUENCE    uint16 big-endian
#   [4-5] TEMP×10     int16  big-endian   (e.g. 256 = 25.6°C)
#   [6-7] SMOKE_PPM   uint16 big-endian
#   [8]   FLAME       uint8  (0 or 1)
#   [9]   OCCUPANCY   uint8
#   [10-11] CRC16     uint16 big-endian

HEADER_FMT = '>BBHhHBB'   # 10 bytes before CRC
FULL_FMT   = '>BBHhHBBH'  # 12 bytes including CRC


def pack_sensor_message(node_id, seq, reading) -> bytes:
    """Pack a SensorReading into 12-byte wire format."""
    temp_i  = int(reading.temperature * 10)
    smoke_i = int(reading.smoke_ppm)
    flame_i = 1 if reading.flame_detected else 0
    occ_i   = min(255, int(reading.occupancy))

    header = struct.pack(HEADER_FMT,
        MSG_SENSOR, node_id, seq,
        temp_i, smoke_i, flame_i, occ_i
    )
    crc = _crc16(header)
    return header + struct.pack('>H', crc)


def pack_heartbeat(node_id, seq) -> bytes:
    header = struct.pack(HEADER_FMT, MSG_HEARTBEAT, node_id, seq, 0, 0, 0, 0)
    crc = _crc16(header)
    return header + struct.pack('>H', crc)


def pack_emergency(node_id, seq) -> bytes:
    header = struct.pack(HEADER_FMT, MSG_EMERGENCY, node_id, seq, 0, 0, 1, 0)
    crc = _crc16(header)
    return header + struct.pack('>H', crc)


def unpack_message(raw: bytes):
    """
    Unpack and validate a received ESP-NOW message.

    Returns:
        dict with keys: msg_type, node_id, seq, temperature, smoke_ppm,
                        flame_detected, occupancy
        or None if CRC fails or length wrong.
    """
    if len(raw) != 12:
        print(f'[Mesh] Bad packet length: {len(raw)}')
        return None

    received_crc = struct.unpack('>H', raw[10:12])[0]
    computed_crc = _crc16(raw[:10])
    if received_crc != computed_crc:
        print(f'[Mesh] CRC mismatch: got {received_crc:#06x}, expected {computed_crc:#06x}')
        return None

    fields = struct.unpack(HEADER_FMT, raw[:10])
    msg_type, node_id, seq, temp_i, smoke_i, flame_i, occ_i = fields

    return {
        'msg_type':      msg_type,
        'node_id':       node_id,
        'seq':           seq,
        'temperature':   temp_i / 10.0,
        'smoke_ppm':     smoke_i,
        'flame_detected':bool(flame_i),
        'occupancy':     occ_i,
    }


# ─── MeshComm Class ─────────────────────────────────────────

class MeshComm:
    def __init__(self, my_node_id: int):
        self.node_id       = my_node_id
        self._seq          = 0
        self._en           = None
        self._peer_times   = {}   # peer_id -> last_seen ticks_ms
        self._peer_data    = {}   # peer_id -> last parsed sensor dict
        self._last_hb      = utime.ticks_ms()

        if ESPNOW_AVAILABLE:
            self._init_espnow()

    def _init_espnow(self):
        try:
            wlan = network.WLAN(network.STA_IF)
            wlan.active(True)
            wlan.disconnect()

            self._en = espnow.ESPNow()
            self._en.active(True)

            for nid, mac in PEERS.items():
                if nid != self.node_id:
                    self._en.add_peer(mac)
                    print(f'[Mesh] Added peer node_{nid}: {mac.hex()}')

            print(f'[Mesh] ESP-NOW ready. Node ID: {self.node_id}')
        except Exception as e:
            print(f'[Mesh] ESP-NOW init failed: {e}')
            self._en = None

    def broadcast_sensors(self, reading):
        """Broadcast sensor reading to all peers."""
        self._seq = (self._seq + 1) & 0xFFFF
        payload = pack_sensor_message(self.node_id, self._seq, reading)
        self._send_all(payload)

    def broadcast_heartbeat(self):
        """Broadcast heartbeat to maintain peer connectivity."""
        now = utime.ticks_ms()
        if utime.ticks_diff(now, self._last_hb) < HEARTBEAT_INTERVAL_S * 1000:
            return
        self._last_hb = now
        self._seq = (self._seq + 1) & 0xFFFF
        payload = pack_heartbeat(self.node_id, self._seq)
        self._send_all(payload)

    def broadcast_emergency(self):
        """Broadcast emergency stop to all peers."""
        payload = pack_emergency(self.node_id, self._seq)
        self._send_all(payload)

    def receive_all(self) -> list:
        """Non-blocking receive — process all pending messages."""
        messages = []
        if self._en is None:
            return messages
        try:
            while True:
                msg = self._en.recv(timeout_ms=0)
                if msg is None:
                    break
                mac, data = msg
                parsed = unpack_message(bytes(data))
                if parsed:
                    peer_id = parsed['node_id']
                    self._peer_times[peer_id] = utime.ticks_ms()
                    self._peer_data[peer_id]  = parsed
                    messages.append(parsed)
        except Exception as e:
            print(f'[Mesh] Receive error: {e}')
        return messages

    def get_peer_data(self) -> dict:
        """Return latest sensor data from all peers. {peer_id: parsed_dict}"""
        return dict(self._peer_data)

    def get_online_peers(self) -> list:
        """Return list of node_ids seen within PEER_TIMEOUT_S seconds."""
        now = utime.ticks_ms()
        timeout_ms = PEER_TIMEOUT_S * 1000
        return [
            pid for pid, t in self._peer_times.items()
            if utime.ticks_diff(now, t) < timeout_ms
        ]

    def is_peer_online(self, peer_id: int) -> bool:
        return peer_id in self.get_online_peers()

    def _send_all(self, payload: bytes):
        if self._en is None:
            return
        for nid, mac in PEERS.items():
            if nid == self.node_id:
                continue
            try:
                self._en.send(mac, payload)
            except Exception as e:
                print(f'[Mesh] Send to node_{nid} failed: {e}')
