#!/usr/bin/env python3
"""Local test harness — simulates the Anna OS runtime for offline development.

Usage:
    python test_harness.py                  # Interactive REPL mode
    python test_harness.py --smoke          # Run automated smoke tests
    python test_harness.py --tool <name>    # Invoke a single tool with JSON args from stdin

This does NOT require Anna credentials. It spawns plugin.py as a subprocess
and speaks JSON-RPC 2.0 over its stdin/stdout, mimicking what the Anna Agent does.
For sampling calls, it either proxies to a local LLM (LM Studio / Ollama) or
returns a synthetic stub response.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import threading
import uuid
from typing import Any, Dict, Optional

PLUGIN_PATH = os.path.join(os.path.dirname(__file__), "plugin.py")

# ── Colors for terminal output ──────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
CYAN   = "\033[96m"
RESET  = "\033[0m"
BOLD   = "\033[1m"


class AnnaLocalHarness:
    """Simulates the Anna Agent by spawning plugin.py and speaking JSON-RPC."""

    def __init__(self, mock_sampling: bool = True):
        self.mock_sampling = mock_sampling
        self.proc = subprocess.Popen(
            [sys.executable, PLUGIN_PATH],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
        )
        self._responses: Dict[str, Any] = {}
        self._lock = threading.Lock()
        self._sampling_requests: Dict[str, dict] = {}

        # Reader thread for plugin stdout
        self._reader = threading.Thread(target=self._read_stdout, daemon=True)
        self._reader.start()

        # Stderr logger
        self._logger = threading.Thread(target=self._read_stderr, daemon=True)
        self._logger.start()

    def _read_stdout(self) -> None:
        assert self.proc.stdout is not None
        for line in self.proc.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                msg = json.loads(line)
            except json.JSONDecodeError:
                print(f"{RED}[harness] Bad JSON from plugin: {line}{RESET}", file=sys.stderr)
                continue

            # Is this a reverse-RPC sampling request from the plugin?
            if "method" in msg and msg["method"] == "sampling/createMessage":
                self._handle_sampling(msg)
            else:
                # Normal response
                rid = msg.get("id")
                if rid is not None:
                    with self._lock:
                        self._responses[rid] = msg

    def _read_stderr(self) -> None:
        assert self.proc.stderr is not None
        for line in self.proc.stderr:
            print(f"{YELLOW}[plugin] {line.rstrip()}{RESET}", file=sys.stderr)

    def _handle_sampling(self, req: dict) -> None:
        """Handle a sampling/createMessage reverse-RPC from the plugin."""
        rid = req.get("id")
        params = req.get("params", {})
        messages = params.get("messages", [])
        prompt = messages[0]["content"]["text"] if messages else ""

        if self.mock_sampling:
            # Return a structured mock response
            mock_text = self._generate_mock_response(prompt, params)
            response = {
                "jsonrpc": "2.0",
                "id": rid,
                "result": {
                    "role": "assistant",
                    "content": {"type": "text", "text": mock_text},
                    "model": "mock-local",
                    "stopReason": "endTurn",
                    "usage": {"inputTokens": len(prompt) // 4, "outputTokens": len(mock_text) // 4, "totalTokens": (len(prompt) + len(mock_text)) // 4},
                },
            }
        else:
            # Proxy to local LLM (LM Studio or Ollama)
            try:
                import requests as req_lib
                lm_url = os.getenv("LMSTUDIO_URL", "http://localhost:1234")
                system_prompt = params.get("systemPrompt", "")
                lm_messages = []
                if system_prompt:
                    lm_messages.append({"role": "system", "content": system_prompt})
                for m in messages:
                    lm_messages.append({"role": m["role"], "content": m["content"]["text"]})

                r = req_lib.post(
                    f"{lm_url}/v1/chat/completions",
                    json={
                        "messages": lm_messages,
                        "temperature": params.get("temperature", 0.2),
                        "max_tokens": params.get("maxTokens", 2048),
                    },
                    timeout=120,
                )
                r.raise_for_status()
                text = r.json()["choices"][0]["message"]["content"]
                response = {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "result": {
                        "role": "assistant",
                        "content": {"type": "text", "text": text},
                        "model": "local-lm-studio",
                        "stopReason": "endTurn",
                        "usage": {"inputTokens": 0, "outputTokens": 0, "totalTokens": 0},
                    },
                }
            except Exception as e:
                response = {
                    "jsonrpc": "2.0",
                    "id": rid,
                    "error": {"code": -32003, "message": f"Local LLM failed: {e}"},
                }

        # Send the sampling response back to the plugin on its stdin
        assert self.proc.stdin is not None
        self.proc.stdin.write(json.dumps(response) + "\n")
        self.proc.stdin.flush()

    def _generate_mock_response(self, prompt: str, params: dict) -> str:
        """Generate a plausible mock response for testing without a real LLM."""
        response_format = params.get("responseFormat", {})
        system_prompt = params.get("systemPrompt", "").lower()

        if response_format.get("type") in ("json_object", "json_schema"):
            # Return structured mock JSON based on prompt context
            if "package" in system_prompt or "dimension" in system_prompt or "datasheet" in system_prompt:
                return json.dumps({
                    "pkg_type": "soic",
                    "pins": 8,
                    "pitch": 1.27,
                    "body_l": 4.9,
                    "body_w": 3.9,
                    "pad_l": 1.04,
                    "pad_w": 0.65,
                    "ep_l": None,
                    "ep_w": None
                })
            elif "requirements" in system_prompt or "component" in system_prompt:
                return json.dumps({
                    "keywords": ["mcu", "buck", "usb"],
                    "voltage": "3.3V",
                    "current": "500mA",
                    "connectivity": ["usb"],
                    "mcu": "STM32F103",
                    "notes": "Mock requirements extraction for testing."
                })
            else:
                return json.dumps({
                    "pkg_type": "soic",
                    "pins": 8,
                    "pitch": 1.27,
                    "body_l": 4.9,
                    "body_w": 3.9,
                    "pad_l": 1.04,
                    "pad_w": 0.65,
                    "ep_l": None,
                    "ep_w": None
                })
        else:
            # Free-text mock response
            return (
                "## Mock Engineering Analysis Report\n\n"
                "This is a mock response from the local test harness.\n"
                "In production, Anna's hosted LLM will provide a thorough analysis.\n\n"
                "### Key Recommendations:\n"
                "- Use 4-layer stackup for mixed-signal designs\n"
                "- Place decoupling caps within 2mm of IC power pins\n"
                "- Minimum trace width: 0.15mm (LPKF ProtoLaser S4)\n"
                "- Minimum via drill: 0.2mm\n"
            )

    def send_request(self, method: str, params: Optional[dict] = None, timeout: float = 30.0) -> dict:
        """Send a JSON-RPC request and wait for the response."""
        rid = str(uuid.uuid4())
        request = {"jsonrpc": "2.0", "id": rid, "method": method}
        if params:
            request["params"] = params

        assert self.proc.stdin is not None
        self.proc.stdin.write(json.dumps(request) + "\n")
        self.proc.stdin.flush()

        # Wait for response
        deadline = time.time() + timeout
        while time.time() < deadline:
            with self._lock:
                if rid in self._responses:
                    return self._responses.pop(rid)
            time.sleep(0.05)
        raise TimeoutError(f"No response for request {rid} within {timeout}s")

    def invoke_tool(self, tool_name: str, arguments: dict, timeout: float = 60.0) -> dict:
        """Invoke a plugin tool by name."""
        return self.send_request("invoke", {
            "tool": tool_name,
            "arguments": arguments,
            "context": {"invoke_id": str(uuid.uuid4()), "sampling_token": "mock-token"},
        }, timeout=timeout)

    def close(self) -> None:
        try:
            self.send_request("shutdown", timeout=3)
        except Exception:
            pass
        self.proc.terminate()
        self.proc.wait(timeout=5)


# ════════════════════════════════════════════════════════════
# Smoke tests
# ════════════════════════════════════════════════════════════

def run_smoke_tests(harness: AnnaLocalHarness) -> bool:
    tests_passed = 0
    tests_failed = 0

    def check(name: str, response: dict, expected_success: bool = True) -> None:
        nonlocal tests_passed, tests_failed
        result = response.get("result", {})
        success = result.get("success", False) if isinstance(result, dict) else False

        # For protocol responses (initialize/describe/health), check result shape
        if isinstance(result, dict) and ("tools" in result or "status" in result or "protocolVersion" in result):
            success = True

        if success == expected_success:
            print(f"  {GREEN}✓{RESET} {name}")
            tests_passed += 1
        else:
            print(f"  {RED}✗{RESET} {name}")
            print(f"    Response: {json.dumps(response, indent=2)[:500]}")
            tests_failed += 1

    print(f"\n{BOLD}═══ PCB Designer Anna App — Smoke Tests ═══{RESET}\n")

    # Test 1: Protocol handshake
    print(f"{CYAN}▸ Protocol{RESET}")
    resp = harness.send_request("initialize")
    check("initialize (v2 handshake)", resp)

    resp = harness.send_request("describe")
    check("describe (manifest)", resp)
    tools = resp.get("result", {}).get("tools", [])
    check(f"manifest has 7 tools (got {len(tools)})", {"result": {"success": len(tools) == 7}})

    resp = harness.send_request("health")
    check("health check", resp)

    # Test 2: parse_requirements (uses sampling)
    print(f"\n{CYAN}▸ Tools{RESET}")
    resp = harness.invoke_tool("parse_requirements", {
        "description": "I need a board with an STM32 MCU, USB-C connector, and a buck converter for 12V to 3.3V"
    })
    check("parse_requirements", resp)

    # Test 3: generate_bom
    resp = harness.invoke_tool("generate_bom", {
        "requirements_json": json.dumps({"keywords": ["mcu", "buck", "usb"]})
    })
    check("generate_bom", resp)

    # Test 4: generate_footprint (QFN)
    resp = harness.invoke_tool("generate_footprint", {
        "footprint_type": "qfn",
        "params_json": json.dumps({
            "name": "QFN-32-TEST",
            "pins": 32,
            "pitch": 0.5,
            "body_l": 5.0,
            "body_w": 5.0,
            "pad_l": 0.4,
            "pad_w": 0.25,
            "ep_l": 3.45,
            "ep_w": 3.45,
        })
    })
    check("generate_footprint (QFN-32)", resp)
    if resp.get("result", {}).get("data", {}).get("kicad_mod_content"):
        check("footprint contains KiCad content", {"result": {"success": True}})

    # Test 5: Unknown tool
    resp = harness.invoke_tool("nonexistent_tool", {})
    has_error = "error" in resp
    check("unknown tool returns error", {"result": {"success": has_error}})

    # Test 6: full_pipeline
    resp = harness.invoke_tool("full_pipeline", {
        "description": "Simple LED blinker with an ATmega328"
    }, timeout=90)
    check("full_pipeline", resp)

    print(f"\n{BOLD}Results: {GREEN}{tests_passed} passed{RESET}, {RED}{tests_failed} failed{RESET}\n")
    return tests_failed == 0


# ════════════════════════════════════════════════════════════
# Interactive REPL
# ════════════════════════════════════════════════════════════

def repl(harness: AnnaLocalHarness) -> None:
    print(f"\n{BOLD}═══ PCB Designer — Anna Local REPL ═══{RESET}")
    print(f"Type {CYAN}tool_name arg1=val1 arg2=val2{RESET} to invoke a tool.")
    print(f"Type {CYAN}describe{RESET}, {CYAN}health{RESET}, or {CYAN}quit{RESET}.\n")

    tools = harness.send_request("describe").get("result", {}).get("tools", [])
    print(f"Available tools: {', '.join(t['name'] for t in tools)}\n")

    while True:
        try:
            line = input(f"{GREEN}anna>{RESET} ").strip()
        except (EOFError, KeyboardInterrupt):
            break

        if not line:
            continue
        if line == "quit":
            break
        if line == "describe":
            resp = harness.send_request("describe")
            print(json.dumps(resp.get("result", {}), indent=2))
            continue
        if line == "health":
            resp = harness.send_request("health")
            print(json.dumps(resp.get("result", {}), indent=2))
            continue

        # Parse: tool_name key=value key=value ...
        parts = line.split(maxsplit=1)
        tool_name = parts[0]
        args = {}
        if len(parts) > 1:
            try:
                args = json.loads(parts[1])
            except json.JSONDecodeError:
                # Try key=value parsing
                for kv in parts[1].split():
                    if "=" in kv:
                        k, v = kv.split("=", 1)
                        args[k] = v

        try:
            resp = harness.invoke_tool(tool_name, args, timeout=90)
            result = resp.get("result", resp.get("error", {}))
            print(json.dumps(result, indent=2)[:3000])
        except TimeoutError:
            print(f"{RED}Timeout waiting for response{RESET}")
        except Exception as e:
            print(f"{RED}Error: {e}{RESET}")


# ════════════════════════════════════════════════════════════
# CLI
# ════════════════════════════════════════════════════════════

def main() -> None:
    import argparse
    parser = argparse.ArgumentParser(description="Anna OS local test harness for pcb-designer")
    parser.add_argument("--smoke", action="store_true", help="Run automated smoke tests")
    parser.add_argument("--tool", type=str, help="Invoke a single tool (reads JSON args from stdin)")
    parser.add_argument("--live-llm", action="store_true", help="Proxy sampling to local LLM instead of mocking")
    args = parser.parse_args()

    harness = AnnaLocalHarness(mock_sampling=not args.live_llm)

    try:
        # Wait for plugin to start
        time.sleep(0.5)

        if args.smoke:
            ok = run_smoke_tests(harness)
            sys.exit(0 if ok else 1)
        elif args.tool:
            tool_args = json.loads(sys.stdin.read()) if not sys.stdin.isatty() else {}
            resp = harness.invoke_tool(args.tool, tool_args, timeout=120)
            print(json.dumps(resp.get("result", resp), indent=2))
        else:
            repl(harness)
    finally:
        harness.close()


if __name__ == "__main__":
    main()
