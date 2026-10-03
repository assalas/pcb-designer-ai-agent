"""Isolated GND copper pour + zone fill.

KiCad's ZONE_FILLER segfaults (exit 139) when run on a board that was built
in-memory via the Python API, while the very same board filled fine after being
reloaded from disk. A segfault cannot be caught with try/except, so this step
runs in its own process: it reloads the saved board, adds the GND pour, fills it
and writes the result atomically. If it crashes, the caller keeps the unpoured
board and the pipeline continues.

Usage (as a script):  python3 -m pcbai.steps.zone_fill <board.kicad_pcb> [net_name]
"""
from __future__ import annotations

import os
import subprocess
import sys

_KICAD_LIB = "/usr/lib/python3/dist-packages"


def _fill_in_process(path: str, net_name: str = "GND") -> int:
    if _KICAD_LIB not in sys.path:
        sys.path.insert(0, _KICAD_LIB)
    import pcbnew

    board = pcbnew.LoadBoard(path)
    net = board.FindNet(net_name)
    if net is None or net.GetNetCode() <= 0:
        print(f"[zone_fill] net '{net_name}' not found — skipping pour")
        return 2

    bb = board.GetBoardEdgesBoundingBox()
    zone = pcbnew.ZONE(board)
    zone.SetNet(net)
    zone.SetLayer(pcbnew.F_Cu)
    zone.SetZoneName(f"{net_name}_pour")
    zone.SetMinThickness(pcbnew.FromMM(0.127))
    zone.SetPadConnection(pcbnew.ZONE_CONNECTION_THERMAL)
    outline = zone.Outline()
    outline.NewOutline()
    for x, y in [(bb.GetLeft(), bb.GetTop()), (bb.GetRight(), bb.GetTop()),
                 (bb.GetRight(), bb.GetBottom()), (bb.GetLeft(), bb.GetBottom())]:
        outline.Append(x, y)
    board.Add(zone)

    board.BuildConnectivity()
    pcbnew.ZONE_FILLER(board).Fill(board.Zones())

    base, ext = os.path.splitext(path)
    tmp = f"{base}.filltmp{ext}"
    pcbnew.SaveBoard(tmp, board)
    os.replace(tmp, path)          # atomic: never leaves a half-written board
    # SaveBoard also writes project sidecars named after the temp file — remove them
    for side in (".kicad_pro", ".kicad_prl"):
        try:
            os.remove(f"{base}.filltmp{side}")
        except FileNotFoundError:
            pass
    print(f"[zone_fill] {net_name} pour filled → {path}")
    return 0


def fill_zones_isolated(path: str, net_name: str = "GND", timeout: int = 120) -> bool:
    """Run the pour + fill in a child process. Returns True on success."""
    pkg_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env = dict(os.environ)
    env["PYTHONPATH"] = os.pathsep.join(
        p for p in [pkg_root, _KICAD_LIB, env.get("PYTHONPATH", "")] if p)
    try:
        r = subprocess.run([sys.executable, "-m", "pcbai.steps.zone_fill", path, net_name],
                           env=env, capture_output=True, text=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        print(f"[zone_fill] ⚠ fill timed out after {timeout}s — board kept without pour")
        return False
    if r.stdout.strip():
        print(r.stdout.strip())
    if r.returncode == 0:
        return True
    reason = "segfault" if r.returncode in (-11, 139) else f"exit {r.returncode}"
    print(f"[zone_fill] ⚠ fill failed ({reason}) — board kept without pour. "
          f"{r.stderr.strip()[-300:]}")
    return False


if __name__ == "__main__":
    sys.exit(_fill_in_process(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "GND"))
