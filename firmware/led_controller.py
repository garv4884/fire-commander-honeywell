"""
led_controller.py — WS2812B NeoPixel animations for ESP32
Drives chasing, pulsing, and strobe patterns to guide evacuees.
"""

import machine
import neopixel
import math
import utime
from config import LED_PIN, LED_COUNT


# ─── LED State Machine ────────────────────────────────────────
# States: IDLE, SAFE_CHASE, CAUTION_CHASE, DANGER_PULSE,
#         REROUTING_FLASH, COMM_LOST_STROBE, EMERGENCY

class LEDController:
    # Colours (R, G, B)
    COLOURS = {
        'SAFE':        (0, 220, 60),     # Green
        'CAUTION':     (220, 180, 0),    # Yellow
        'WARNING':     (220, 100, 0),    # Orange
        'DANGER':      (220, 0,   0),    # Red
        'BLOCKED':     (80,  0,   0),    # Dark red
        'WHITE':       (200, 200, 200),
        'BLUE':        (0,   0,   200),
        'OFF':         (0,   0,   0),
    }

    CHASE_LEN = 4       # pixels in chase group
    CHASE_FPS = 30      # frames per second (33ms tick)

    def __init__(self):
        pin = machine.Pin(LED_PIN, machine.Pin.OUT)
        self.np    = neopixel.NeoPixel(pin, LED_COUNT)
        self.state = 'IDLE'
        self._offset       = 0
        self._brightness   = 1.0
        self._direction    = 1          # 1 = toward exit, -1 = reverse
        self._hazard_level = 'SAFE'
        self._flash_count  = 0
        self._last_tick    = utime.ticks_ms()
        self._tick_ms      = 1000 // self.CHASE_FPS

    def set_state(self, hazard_level: str, direction: int = 1):
        """
        Set LED animation based on hazard level and evacuation direction.

        Args:
            hazard_level: 'SAFE' | 'CAUTION' | 'WARNING' | 'DANGER' | 'BLOCKED'
            direction:     1 = chase toward higher pixel index (exit direction)
                          -1 = reverse direction (rerouting)
        """
        if hazard_level != self._hazard_level or direction != self._direction:
            self._hazard_level = hazard_level
            self._direction    = direction
            self._flash_count  = 0

        if hazard_level == 'BLOCKED':
            self.state = 'DANGER_PULSE'
        elif hazard_level in ('DANGER', 'WARNING'):
            self.state = 'DANGER_PULSE'
        elif hazard_level == 'CAUTION':
            self.state = 'CAUTION_CHASE'
        else:
            self.state = 'SAFE_CHASE'

    def set_rerouting(self):
        """Trigger the white flash + direction-change animation."""
        self.state        = 'REROUTING_FLASH'
        self._flash_count = 0

    def set_comm_lost(self):
        """Red/Blue strobe — communication lost."""
        self.state = 'COMM_LOST_STROBE'

    def set_emergency(self):
        """All-red full brightness — emergency."""
        self.state = 'EMERGENCY'

    def set_idle(self):
        self.state = 'IDLE'
        self._fill(self.COLOURS['OFF'])
        self.np.write()

    def tick(self):
        """Call this in the main loop every tick (~33ms). Non-blocking."""
        now = utime.ticks_ms()
        if utime.ticks_diff(now, self._last_tick) < self._tick_ms:
            return
        self._last_tick = now

        if   self.state == 'SAFE_CHASE':       self._do_chase('SAFE')
        elif self.state == 'CAUTION_CHASE':    self._do_chase('CAUTION')
        elif self.state == 'DANGER_PULSE':     self._do_pulse('DANGER')
        elif self.state == 'REROUTING_FLASH':  self._do_rerouting_flash()
        elif self.state == 'COMM_LOST_STROBE': self._do_comm_lost_strobe()
        elif self.state == 'EMERGENCY':        self._do_emergency()

    # ─── Private animation methods ───────────────────────────

    def _do_chase(self, colour_key):
        """Chasing dot group in the direction of evacuation."""
        colour = self.COLOURS[colour_key]
        self._fill(self.COLOURS['OFF'])

        for i in range(self.CHASE_LEN):
            # Fade trail: brightest at front, dim behind
            idx = (self._offset + i * self._direction) % LED_COUNT
            factor = (i + 1) / self.CHASE_LEN
            self.np[idx] = self._scale(colour, factor)

        self.np.write()
        self._offset = (self._offset + self._direction) % LED_COUNT

    def _do_pulse(self, colour_key):
        """Sine-wave brightness pulsing for danger zones."""
        colour = self.COLOURS[colour_key]
        # 2 Hz sine pulse
        t      = utime.ticks_ms() / 1000.0
        factor = 0.5 + 0.5 * math.sin(2 * math.pi * 2.0 * t)
        scaled = self._scale(colour, factor)
        self._fill(scaled)
        self.np.write()

    def _do_rerouting_flash(self):
        """Brief white flash (6 frames = 200ms), then return to chase."""
        if self._flash_count < 6:
            self._fill(self.COLOURS['WHITE'])
            self.np.write()
            self._flash_count += 1
        else:
            # Transition back to appropriate chase
            self.state = 'CAUTION_CHASE' if self._hazard_level in ('CAUTION', 'WARNING') else 'SAFE_CHASE'
            self._flash_count = 0

    def _do_comm_lost_strobe(self):
        """Alternating red/blue strobe at 4 Hz."""
        t = utime.ticks_ms()
        if (t // 125) % 2 == 0:
            self._fill(self.COLOURS['DANGER'])
        else:
            self._fill(self.COLOURS['BLUE'])
        self.np.write()

    def _do_emergency(self):
        """Full red at max brightness — all exits blocked."""
        t      = utime.ticks_ms() / 1000.0
        factor = 0.7 + 0.3 * math.sin(2 * math.pi * 3.0 * t)
        self._fill(self._scale(self.COLOURS['DANGER'], factor))
        self.np.write()

    # ─── Helpers ─────────────────────────────────────────────

    def _fill(self, colour):
        for i in range(LED_COUNT):
            self.np[i] = colour

    @staticmethod
    def _scale(colour, factor):
        return (
            int(colour[0] * factor),
            int(colour[1] * factor),
            int(colour[2] * factor),
        )

    def set_path_direction(self, current_node: str, next_node: str):
        """
        Determine LED direction based on path nodes.
        Convention: higher-index nodes are toward exits.
        In a real deployment, this maps to physical LED segment orientation.
        """
        # For now: positive direction means "toward exit"
        # This would be overridden with a physical node map in production
        self._direction = 1
