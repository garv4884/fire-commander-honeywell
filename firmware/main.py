"""
main.py — ESP32 Firmware Entry Point
Dynamic Fire Evacuation Router — Main Loop
"""

import utime
import machine
import sys
import ujson

from config import (
    NODE_ID, NODE_ZONE, SENSOR_INTERVAL_MS, SIMULATION_MODE,
    MQTT_BROKER, MQTT_PORT, MQTT_CLIENT, MQTT_TOPIC_PUB, MQTT_TOPIC_PATH, MQTT_TOPIC_SUB
)
from sensor_reader  import SensorReader
from sensor_fusion  import compute_edge_weight, classify_hazard
from pathfinder     import find_evacuation_path, find_fallback_path
from led_controller import LEDController
from mesh_comm      import MeshComm
from failsafe       import FailsafeManager, SystemMode

# ─── MQTT (optional — gracefully disabled if broker unreachable) ──
try:
    from umqtt.simple import MQTTClient
    MQTT_AVAILABLE = True
except ImportError:
    MQTT_AVAILABLE = False
    print('[Main] umqtt not available — MQTT disabled')

# ─── Watchdog Timer ───────────────────────────────────────────
# Resets ESP32 if firmware hangs for >10 seconds
try:
    wdt = machine.WDT(timeout=10_000)
    WDT_AVAILABLE = True
except Exception:
    WDT_AVAILABLE = False
    print('[Main] WDT not available')


# ═══════════════════════════════════════════════════════════════
# Initialisation
# ═══════════════════════════════════════════════════════════════

print(f'\n=== FIRE EVACUATION ROUTER — NODE {NODE_ID} ===')
print(f'Zone: {NODE_ZONE}, SimMode: {SIMULATION_MODE}')

sensor   = SensorReader(NODE_ID, NODE_ZONE)
leds     = LEDController()
mesh     = MeshComm(NODE_ID)
failsafe = FailsafeManager(mesh, leds)

# ─── MQTT Setup ───────────────────────────────────────────────
mqtt_client = None
if MQTT_AVAILABLE:
    try:
        mqtt_client = MQTTClient(MQTT_CLIENT, MQTT_BROKER, MQTT_PORT, keepalive=30)

        def _on_mqtt_msg(topic, msg):
            """Handle simulation injection via MQTT."""
            try:
                data = ujson.loads(msg)
                node_target = data.get('nodeId', NODE_ZONE)
                if node_target == NODE_ZONE:
                    sensor.inject_simulation(data)
                    print(f'[MQTT] Injected sim data: T={data.get("temperature")}°C')
            except Exception as e:
                print(f'[MQTT] Parse error: {e}')

        mqtt_client.set_callback(_on_mqtt_msg)
        mqtt_client.connect()
        mqtt_client.subscribe(MQTT_TOPIC_SUB)
        print(f'[MQTT] Connected to {MQTT_BROKER}:{MQTT_PORT}')
    except Exception as e:
        print(f'[MQTT] Connection failed: {e} — continuing without MQTT')
        mqtt_client = None

# ─── Build live weights dict ──────────────────────────────────
# {(from_id, to_id): weight} — updated every tick
from config import EDGES
_live_weights = {(f, t): float(w) for f, t, w in EDGES}

# ─── State ────────────────────────────────────────────────────
_seq              = 0
_last_path        = None
_last_sensor_tick = utime.ticks_ms()
_all_readings     = {}   # {node_id: SensorReading}


# ═══════════════════════════════════════════════════════════════
# Main Loop
# ═══════════════════════════════════════════════════════════════

def main():
    global _seq, _last_path, _last_sensor_tick, _live_weights, _all_readings

    print('[Main] Starting main loop...')
    leds.set_state('SAFE')

    while True:
        now = utime.ticks_ms()

        # ── 1. Watchdog feed ──────────────────────────────────
        if WDT_AVAILABLE:
            wdt.feed()

        # ── 2. Read local sensors (every SENSOR_INTERVAL_MS) ──
        if utime.ticks_diff(now, _last_sensor_tick) >= SENSOR_INTERVAL_MS:
            _last_sensor_tick = now

            local = sensor.read()

            # Validate reading
            if not failsafe.validate_sensor_reading(local):
                print('[Main] Sensor reading invalid — using last known')
                local = sensor._last_reading

            _all_readings[NODE_ZONE] = local

            # ── 3. Broadcast to mesh peers ────────────────────
            mesh.broadcast_sensors(local)
            mesh.broadcast_heartbeat()

            # ── 4. Receive peer data ──────────────────────────
            peer_msgs = mesh.receive_all()
            peer_readings = {}
            for msg in peer_msgs:
                if failsafe.validate_mesh_message(msg):
                    from sensor_reader import SensorReading
                    pr = SensorReading(
                        str(msg['node_id']),
                        temperature   = msg['temperature'],
                        smoke_ppm     = msg['smoke_ppm'],
                        flame_detected= msg['flame_detected'],
                        occupancy     = msg['occupancy'],
                    )
                    # Map peer node_id to their zone (from config)
                    from config import ESP32_ZONE_MAP_PY
                    zone = ESP32_ZONE_MAP_PY.get(msg['node_id'], f'node_{msg["node_id"]}')
                    _all_readings[zone] = pr
                    peer_readings[msg['node_id']] = msg

            # ── 5. Update fail-safe state ─────────────────────
            mode = failsafe.update(local, peer_readings)

            # ── 6. Sensor fusion — update edge weights ────────
            for (frm, to, base_w) in EDGES:
                from_r = _all_readings.get(frm)
                to_r   = _all_readings.get(to)
                w, blocked, _ = compute_edge_weight(base_w, from_r, to_r)
                _live_weights[(frm, to)] = w
                _live_weights[(to, frm)] = w  # Undirected

            # ── 7. Dijkstra path computation ──────────────────
            if mode == SystemMode.ISOLATED or failsafe.should_use_fallback_path():
                result = find_fallback_path(NODE_ZONE)
            else:
                result = find_evacuation_path(NODE_ZONE, _live_weights)

            # ── 8. Update LED animations ──────────────────────
            if mode not in (SystemMode.EMERGENCY, SystemMode.ISOLATED):
                hazard = classify_hazard(local)

                if result is None:
                    leds.set_emergency()
                    print('[Main] ⚠ No reachable exit! Emergency pattern.')
                elif result != _last_path:
                    leds.set_rerouting()
                    utime.sleep_ms(200)
                    leds.set_state(hazard, direction=1)
                    print(f'[Main] Path: {" → ".join(result["path"])} (cost={result["cost"]:.1f})')
                else:
                    leds.set_state(hazard, direction=1)

                _last_path = result

            # ── 9. Publish to MQTT / Serial ───────────────────
            payload = {
                'nodeId':   NODE_ZONE,
                'sensors':  local.to_dict(),
                'path':     result,
                'mode':     mode,
                'status':   failsafe.get_status_dict(),
            }

            # MQTT
            if mqtt_client:
                try:
                    mqtt_client.check_msg()
                    mqtt_client.publish(MQTT_TOPIC_PUB, ujson.dumps(payload))
                except Exception as e:
                    print(f'[MQTT] Publish error: {e}')

            # Serial (always — for dashboard bridge)
            try:
                print('DATA:' + ujson.dumps(payload))
            except Exception:
                pass

        # ── 10. LED animation tick (non-blocking) ─────────────
        leds.tick()

        utime.sleep_ms(5)   # 200Hz main loop


# ─── Entry ────────────────────────────────────────────────────
# ESP32_ZONE_MAP in Python (mirrors config.py ESP32_ZONE_MAP)
import config
config.ESP32_ZONE_MAP_PY = {1: 'F1_B3', 2: 'F1_H2', 3: 'F2_H2'}

try:
    main()
except Exception as e:
    import sys
    sys.print_exception(e)
    print('[Main] CRASH — resetting in 3s...')
    utime.sleep(3)
    machine.reset()
