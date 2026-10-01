from pcbai.steps.design_compiler import compile_design
import tempfile

prompts = [
    "WiFi board with ESP32, USB-C power, and LDO regulator",
    "STM32 sensor board with I2C IMU and LiPo charger",
]

for prompt in prompts:
    with tempfile.TemporaryDirectory() as d:
        try:
            r = compile_design(prompt, d)
            mpns = [c["mpn"] for c in r["bom"]]
            print(f"✓ [{prompt[:45]}]")
            print(f"  BOM ({len(mpns)} parts): {mpns}")
            print()
        except RuntimeError as e:
            print(f"⚠  [{prompt[:45]}]")
            print(f"  {e}")
            print()
