import tempfile
import shutil
import os
from pcbai.steps.design_compiler import compile_design

complex_prompt = (
    "Design a high-performance robotics controller board. It needs a powerful "
    "microcontroller, dual motor drivers for brushed DC motors, a 9-axis IMU "
    "for motion tracking, an OLED display for status output, an SD card slot "
    "for data logging, a Bluetooth module for wireless telemetry, an ADC for "
    "battery voltage monitoring, and a 5V buck converter to step down a 12V "
    "LiPo battery input. Include a USB-C port for programming and debugging."
)

out_dir = "/home/assalas/pcb-designer-ai-agent/complex_test_output"
os.makedirs(out_dir, exist_ok=True)

print(f"=== Testing Complex Prompt ===")
result = compile_design(complex_prompt, out_dir)
print(f"Saved PCB and ZIP to: {out_dir}")
