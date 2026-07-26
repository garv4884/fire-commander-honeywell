# ============================================================
# ESP32 Firmware — Configuration
# Central config for building layout, sensors, mesh network
# ============================================================

# ─── Node Identity ────────────────────────────────────────────
NODE_ID = 1           # Unique ID for this ESP32 (1, 2, or 3)
NODE_ZONE = 'F1_B3'  # Building zone this node monitors

# ─── Sensor GPIO Pins ─────────────────────────────────────────
DHT_PIN      = 4     # DHT22 temperature/humidity sensor
SMOKE_ADC    = 34    # MQ-2 smoke sensor (ADC1, 12-bit)
FLAME_PIN    = 25    # IR Flame sensor (digital output)
LED_PIN      = 5     # WS2812B NeoPixel data line
LED_COUNT    = 30    # Number of LEDs in the strip
BUZZER_PIN   = 26    # Passive buzzer

# ─── Sensor Thresholds ────────────────────────────────────────
TEMP_AMBIENT      = 25.0   # °C — baseline ambient temperature
TEMP_CAUTION      = 40.0   # °C — switch to CAUTION
TEMP_WARNING      = 60.0   # °C — switch to WARNING
TEMP_DANGER       = 80.0   # °C — switch to DANGER
TEMP_BLOCK        = 150.0  # °C — path becomes impassable

SMOKE_CAUTION     = 100    # PPM — switch to CAUTION
SMOKE_WARNING     = 300    # PPM
SMOKE_DANGER      = 500    # PPM
SMOKE_BLOCK       = 800    # PPM — path becomes impassable

# MQ-2 ADC calibration (raw 0-4095 → PPM)
MQ2_CLEAN_AIR_FACTOR = 9.83
MQ2_R0               = 10.0   # kΩ — calibrate in clean air

# ─── Sensor Fusion Coefficients ───────────────────────────────
# W(e) = base × exp(α·T̃ + β·S̃ + γ·F) × (1 + δ·O)
ALPHA = 2.0    # Temperature weight
BETA  = 3.0    # Smoke density weight
GAMMA = 5.0    # Flame presence weight
DELTA = 0.1    # Occupancy penalty

# ─── Building Graph ───────────────────────────────────────────
# Each node: (id, is_exit, neighbour_edges)
# Each edge: (edge_id, from_id, to_id, base_weight)
# Compact representation optimised for ESP32 memory

NODES = {
    'F1_A1': {'exit': False, 'floor': 1},
    'F1_A2': {'exit': False, 'floor': 1},
    'F1_A3': {'exit': False, 'floor': 1},
    'F1_A4': {'exit': False, 'floor': 1},
    'F1_H1': {'exit': False, 'floor': 1},
    'F1_H2': {'exit': False, 'floor': 1},
    'F1_H3': {'exit': False, 'floor': 1},
    'F1_B1': {'exit': False, 'floor': 1},
    'F1_B2': {'exit': False, 'floor': 1},
    'F1_B3': {'exit': False, 'floor': 1},
    'F1_B4': {'exit': False, 'floor': 1},
    'F1_STAIR_W': {'exit': False, 'floor': 1},
    'EXIT_NORTH': {'exit': True,  'floor': 1},
    'EXIT_SOUTH': {'exit': True,  'floor': 1},
    'EXIT_WEST':  {'exit': True,  'floor': 1},
    'F2_D1': {'exit': False, 'floor': 2},
    'F2_D2': {'exit': False, 'floor': 2},
    'F2_D3': {'exit': False, 'floor': 2},
    'F2_D4': {'exit': False, 'floor': 2},
    'F2_H1': {'exit': False, 'floor': 2},
    'F2_H2': {'exit': False, 'floor': 2},
    'F2_H3': {'exit': False, 'floor': 2},
    'F2_E1': {'exit': False, 'floor': 2},
    'F2_E2': {'exit': False, 'floor': 2},
    'F2_E3': {'exit': False, 'floor': 2},
    'F2_STAIR_W': {'exit': False, 'floor': 2},
}

# (from, to, base_weight) — undirected
EDGES = [
    ('F1_A1', 'F1_H1', 10), ('F1_A2', 'F1_H2', 10), ('F1_A3', 'F1_H3', 10),
    ('F1_A4', 'F1_H3', 12), ('F1_A1', 'EXIT_NORTH', 15), ('F1_A2', 'EXIT_NORTH', 8),
    ('F1_H1', 'F1_H2', 10), ('F1_H2', 'F1_H3', 10), ('F1_H3', 'F1_STAIR_W', 12),
    ('F1_H1', 'EXIT_WEST', 8), ('F1_H1', 'F1_B1', 10), ('F1_H2', 'F1_B2', 10),
    ('F1_H3', 'F1_B3', 10), ('F1_H3', 'F1_B4', 12), ('F1_B1', 'F1_B2', 10),
    ('F1_B2', 'F1_B3', 10), ('F1_B3', 'EXIT_SOUTH', 8), ('F1_STAIR_W', 'F2_STAIR_W', 20),
    ('F2_D1', 'F2_H1', 10), ('F2_D2', 'F2_H2', 10), ('F2_D3', 'F2_H3', 10),
    ('F2_D4', 'F2_H3', 12), ('F2_H1', 'F2_H2', 10), ('F2_H2', 'F2_H3', 10),
    ('F2_H3', 'F2_STAIR_W', 12), ('F2_H1', 'F2_E1', 10), ('F2_H2', 'F2_E2', 10),
    ('F2_H3', 'F2_E3', 10), ('F2_E1', 'F2_E2', 10), ('F2_E2', 'F2_E3', 10),
    ('F1_A1', 'F1_A2', 10), ('F1_A2', 'F1_A3', 10), ('F1_A3', 'F1_A4', 10),
    ('F2_D1', 'F2_D2', 10), ('F2_D2', 'F2_D3', 10), ('F2_D3', 'F2_D4', 10),
]

EXIT_NODES = ['EXIT_NORTH', 'EXIT_SOUTH', 'EXIT_WEST']

# ─── ESP-NOW Mesh Peers ───────────────────────────────────────
# Each node stores MAC addresses of its peers
# Replace with actual MAC addresses after hardware flashing
PEERS = {
    1: b'\xAA\xBB\xCC\xDD\xEE\x01',
    2: b'\xAA\xBB\xCC\xDD\xEE\x02',
    3: b'\xAA\xBB\xCC\xDD\xEE\x03',
}
MY_MAC = PEERS[NODE_ID]

# ─── MQTT Configuration ───────────────────────────────────────
MQTT_BROKER   = '192.168.1.100'   # Replace with your broker IP
MQTT_PORT     = 1883
MQTT_CLIENT   = f'fire_node_{NODE_ID}'
MQTT_TOPIC_PUB  = f'fire/node_{NODE_ID}/sensors'
MQTT_TOPIC_PATH = f'fire/node_{NODE_ID}/path'
MQTT_TOPIC_SUB  = 'fire/simulate/inject'

# ─── Timing ───────────────────────────────────────────────────
SENSOR_INTERVAL_MS   = 100   # Read sensors every 100ms
HEARTBEAT_INTERVAL_S = 2     # Broadcast heartbeat every 2s
PEER_TIMEOUT_S       = 6     # Mark peer dead after 6s silence
PATH_UPDATE_DEBOUNCE = 300   # ms — path must update within 300ms of change

# ─── Simulation Mode ──────────────────────────────────────────
# Set to True to accept injected sensor data via Serial/MQTT
SIMULATION_MODE = False
SERIAL_BAUD     = 115200
