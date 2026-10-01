import os
from pcbai.steps.design_compiler import compile_design

simple_prompt = (
    "Design a simple blinky board with an ESP32 microcontroller, a single status LED, "
    "a USB-C port, and a 3.3V LDO regulator."
)

out_dir = "/home/assalas/pcb-designer-ai-agent/simple_test_output"
os.makedirs(out_dir, exist_ok=True)

print(f"=== Testing SIMPLE Prompt ===")
print(f"Prompt: {simple_prompt}")
result = compile_design(simple_prompt, out_dir)
print(f"Saved PCB and ZIP to: {out_dir}")
