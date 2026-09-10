from __future__ import annotations

from typing import List, Dict

try:
    from skidl import Part, Net, ERC, generate_netlist, subcircuit
except Exception:  # pragma: no cover
    Part = Net = ERC = generate_netlist = subcircuit = None  # type: ignore


def generate_buck_converter(vcc_net, gnd_net, part):
    """Reference circuit for a standard buck converter setup."""
    # Assuming standard buck converter pins: 1=VIN, 2=GND, 3=SW, etc.
    if Part is not None:
        vcc_net += part['1']
        gnd_net += part['2']
        
        # Instantiate required components
        inductor = Part('Device', 'L', value='10uH', footprint='L_SMD_0603_1608Metric')
        cout = Part('Device', 'C', value='22uF', footprint='C_0805_2012Metric')
        cin = Part('Device', 'C', value='10uF', footprint='C_0805_2012Metric')
        
        # Connect input capacitor
        vcc_net += cin['1']
        gnd_net += cin['2']
        
        # Connect switch node
        sw_net = Net('SW')
        sw_net += part['3'], inductor['1']
        
        # Connect output
        vout_net = Net('VOUT')
        vout_net += inductor['2'], cout['1']
        gnd_net += cout['2']


def generate_mcu_decoupling(vcc_net, gnd_net, part):
    """Reference circuit for MCU decoupling capacitors."""
    if Part is not None:
        vcc_net += part['1']
        gnd_net += part['2']
        
        # Instantiate 100nF decoupling capacitor
        c_dec1 = Part('Device', 'C', value='100nF', footprint='C_0402_1005Metric')
        c_dec2 = Part('Device', 'C', value='100nF', footprint='C_0402_1005Metric')
        c_bulk = Part('Device', 'C', value='10uF', footprint='C_0603_1608Metric')
        
        vcc_net += c_dec1['1'], c_dec2['1'], c_bulk['1']
        gnd_net += c_dec1['2'], c_dec2['2'], c_bulk['2']


def bom_to_schematic(bom: List[Dict]) -> str:
    """Create a simple SKiDL netlist if SKiDL is available.

    Returns a textual netlist (XML) or a message if SKiDL isn't installed.
    """
    if Part is None:
        return "SKiDL not installed. Install with `pip install skidl` to enable schematic generation."

    vcc = Net('VCC')
    gnd = Net('GND')

    refs = []
    for i, p in enumerate(bom, start=1):
        # Generic part symbol; in reality, we'd map MPN/package to SKiDL libs
        part = Part('Device', 'U', value=p.get('mpn', 'U'), ref=f'U{i}', footprint=p.get('package', ''))
        
        # Intelligently select reference circuits based on component type/keywords
        # We look for keywords or component types in the BOM item
        if 'buck' in p.get('mpn', '').lower() or 'mp1584en' in p.get('mpn', '').lower():
            generate_buck_converter(vcc, gnd, part)
        elif 'mcu' in p.get('mpn', '').lower() or 'stm32' in p.get('mpn', '').lower() or 'esp32' in p.get('mpn', '').lower():
            generate_mcu_decoupling(vcc, gnd, part)
        else:
            # Fallback for unknown parts
            vcc += part['1']
            gnd += part['2']
            
        refs.append(part.ref)

    try:
        ERC()
    except Exception as e:
        print(f"ERC failed (often due to stub parts): {e}")
        
    return generate_netlist()
