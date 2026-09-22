import json
import subprocess

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
