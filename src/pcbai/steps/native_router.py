from __future__ import annotations
import pcbnew
import math

def route_manhattan(board: pcbnew.BOARD, start_pos: pcbnew.VECTOR2I, end_pos: pcbnew.VECTOR2I, net_code: int, width: int):
    """Draws a two-segment orthogonal (Manhattan) track between two points."""
    mid_pos = pcbnew.VECTOR2I(end_pos.x, start_pos.y)
    
    # We only draw a segment if it has length > 0
    if start_pos.x != mid_pos.x or start_pos.y != mid_pos.y:
        t1 = pcbnew.PCB_TRACK(board)
        t1.SetStart(start_pos)
        t1.SetEnd(mid_pos)
        t1.SetWidth(width)
        t1.SetLayer(pcbnew.F_Cu)
        t1.SetNetCode(net_code)
        board.Add(t1)
        
    if mid_pos.x != end_pos.x or mid_pos.y != end_pos.y:
        t2 = pcbnew.PCB_TRACK(board)
        t2.SetStart(mid_pos)
        t2.SetEnd(end_pos)
        t2.SetWidth(width)
        t2.SetLayer(pcbnew.F_Cu)
        t2.SetNetCode(net_code)
        board.Add(t2)

def autoroute_board(board: pcbnew.BOARD):
    """
    [EXPERIMENTAL / NOT READY FOR PRODUCTION]
    Native Python Auto-Router using pcbnew API.
    
    WARNING: This is a naive Manhattan router (L-shapes) acting purely as a 
    scaffold/proof-of-concept for future A* solvers. 
    
    It currently lacks:
    - Obstacle avoidance (traces WILL cross and short-circuit)
    - Layer hopping (no vias are generated)
    - DRC compliance (clearances are ignored)
    
    For professional routing, use the exported .dsn file with FreeRouting instead.
    """
    # Group pads by net code
    nets_pads = {}
    for fp in board.GetFootprints():
        for pad in fp.Pads():
            net_code = pad.GetNetCode()
            if net_code > 0:
                nets_pads.setdefault(net_code, []).append(pad)
                
    for net_code, pads in nets_pads.items():
        if len(pads) < 2:
            continue
            
        net_info = board.FindNet(net_code)
        if not net_info: continue
        net_name = net_info.GetNetname()
        
        # Determine trace width based on net name (Power vs Signal)
        is_power = any(pwr in net_name.upper() for pwr in ["VCC", "VDD", "VIN", "5V", "3V3", "GND"])
        trace_width = pcbnew.FromMM(0.5) if is_power else pcbnew.FromMM(0.25)
            
        # Connect the pads in a simple daisy chain
        for i in range(len(pads) - 1):
            start_pos = pads[i].GetPosition()
            end_pos = pads[i+1].GetPosition()
            
            route_manhattan(board, start_pos, end_pos, net_code, trace_width)

