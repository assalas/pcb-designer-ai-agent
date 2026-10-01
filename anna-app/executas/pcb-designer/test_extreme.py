import os
from pcbai.steps.design_compiler import compile_design

extreme_prompt = (
    "Design a high-performance autonomous drone flight controller. I need a powerful STM32H7 "
    "microcontroller, an external QSPI NOR flash chip for blackbox logging, two redundant "
    "6-axis IMUs on separate SPI buses, a high-precision barometer for altitude sensing, "
    "a magnetometer for heading, a GPS module with integrated antenna, a CAN transceiver "
    "for DroneCAN ESCs, a 5V 3A buck converter for powering servos, a clean 3.3V LDO for "
    "analog sensors, an OSD (On-Screen Display) video overlay chip for FPV cameras, "
    "a high-side current sensor amplifier to measure battery draw, and a USB-C port."
)

out_dir = "/home/assalas/pcb-designer-ai-agent/extreme_test_output"
os.makedirs(out_dir, exist_ok=True)

print(f"=== Testing EXTREME Prompt ===")
print(f"Prompt: {extreme_prompt}")
result = compile_design(extreme_prompt, out_dir)
print(f"Saved PCB and ZIP to: {out_dir}")
