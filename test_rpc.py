"""
Test script for the PCB Designer AI Agent plugin.

To bypass Anna OS sampling and use your own LLM provider, set the environment variables before running this script:

For Gemini:
  export PCB_AI_LLM_PROVIDER=gemini
  export GEMINI_API_KEY=your_key
  export PCB_AI_MODEL=gemini-3.6-flash

For Claude:
  export PCB_AI_LLM_PROVIDER=claude
  export ANTHROPIC_API_KEY=your_key
  export PCB_AI_MODEL=claude-3-5-sonnet-20240620

For OpenAI:
  export PCB_AI_LLM_PROVIDER=openai
  export OPENAI_API_KEY=your_key
  export PCB_AI_MODEL=gpt-4o-mini
"""
import os
import json
import subprocess

if __name__ == '__main__':
    req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "invoke",
        "params": {
            "tool": "full_pipeline",
            "arguments": {
                "description": "Design a board with an ESP32, an IMU sensor, a LiPo battery charger, a USB-C port, a 3.3V LDO, and an SD card slot"
            },
            "context": {}
        }
    }

    p = subprocess.Popen(
        ["uv", "run", "--project", "anna-app/executas/pcb-designer", "python3", "anna-app/executas/pcb-designer/plugin.py"],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    stdout, stderr = p.communicate(json.dumps(req) + "\n" + json.dumps({"jsonrpc": "2.0", "id": 2, "method": "shutdown"}) + "\n")
    for line in stdout.splitlines():
        try:
            data = json.loads(line)
            if "result" in data:
                print(json.dumps(data["result"], indent=2))
        except:
            pass
    print("\n--- STDERR ---")
    print(stderr)
