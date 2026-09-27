import os
import json
import zipfile
import subprocess
from pcbai.steps.kicad_schematic_writer import generate_schematic
from pcbai.steps.kicad_pcb_writer import generate_pcb

def compile_design(prompt: str, output_dir: str) -> dict:
    os.makedirs(output_dir, exist_ok=True)
    
    bom = [
      {"ref": "U1", "mpn": "ESP32-C3-MINI-1", "manufacturer": "Espressif", "package": "LGA-54", "description": "WiFi+BLE SoC module", "quantity": 1, "footprint": "RF_Module:ESP32-C3-WROOM-02"},
      {"ref": "J1", "mpn": "USB4085-GF-A", "manufacturer": "GCT", "package": "USB-C", "description": "USB Type-C 2.0 Receptacle", "quantity": 1, "footprint": "Connector_USB:USB_C_Receptacle_GCT_USB4085"},
      {"ref": "U2", "mpn": "AP2112K-3.3TRG1", "manufacturer": "Diodes Inc.", "package": "SOT-23-5", "description": "3.3V 600mA LDO", "quantity": 1, "footprint": "Package_TO_SOT_SMD:SOT-23-5"},
      {"ref": "U3", "mpn": "BME280", "manufacturer": "Bosch", "package": "LGA-8", "description": "Temp/Humidity/Pressure sensor", "quantity": 1, "footprint": "Package_LGA:Bosch_LGA-8_2.5x2.5mm_P0.65mm_ClockwisePinNumbering"},
      {"ref": "D1", "mpn": "APHHS1005CGCK", "manufacturer": "Kingbright", "package": "0402", "description": "Green status LED", "quantity": 1, "footprint": "LED_SMD:LED_0402_1005Metric"},
      {"ref": "R1", "mpn": "RC0402FR-07330RL", "manufacturer": "Yageo", "package": "0402", "description": "330Ω LED series resistor", "quantity": 1, "footprint": "Resistor_SMD:R_0402_1005Metric"},
      {"ref": "C1", "mpn": "CL05A104KO5NNNC", "manufacturer": "Samsung", "package": "0402", "description": "100nF decoupling cap", "quantity": 1, "footprint": "Capacitor_SMD:C_0402_1005Metric"},
      {"ref": "C2", "mpn": "CL05A104KO5NNNC", "manufacturer": "Samsung", "package": "0402", "description": "100nF decoupling cap", "quantity": 1, "footprint": "Capacitor_SMD:C_0402_1005Metric"},
      {"ref": "C3", "mpn": "GRM155R61A106ME44D", "manufacturer": "Murata", "package": "0402", "description": "10μF bulk cap", "quantity": 1, "footprint": "Capacitor_SMD:C_0402_1005Metric"},
      {"ref": "C4", "mpn": "CL05A104KO5NNNC", "manufacturer": "Samsung", "package": "0402", "description": "100nF VBUS filter cap", "quantity": 1, "footprint": "Capacitor_SMD:C_0402_1005Metric"},
      {"ref": "C5", "mpn": "CL05A104KO5NNNC", "manufacturer": "Samsung", "package": "0402", "description": "100nF VBUS filter cap", "quantity": 1, "footprint": "Capacitor_SMD:C_0402_1005Metric"},
      {"ref": "SW1", "mpn": "KSC942J LFS", "manufacturer": "CK", "package": "SMD", "description": "BOOT button (GPIO9→GND)", "quantity": 1, "footprint": "Button_Switch_SMD:SW_Push_1P1T_NO_CK_KSC9xxG"},
      {"ref": "SW2", "mpn": "KSC942J LFS", "manufacturer": "CK", "package": "SMD", "description": "RESET button (EN→GND)", "quantity": 1, "footprint": "Button_Switch_SMD:SW_Push_1P1T_NO_CK_KSC9xxG"},
      {"ref": "R2", "mpn": "RC0402FR-074K7L", "manufacturer": "Yageo", "package": "0402", "description": "4.7kΩ I2C SCL pull-up", "quantity": 1, "footprint": "Resistor_SMD:R_0402_1005Metric"},
      {"ref": "R3", "mpn": "RC0402FR-074K7L", "manufacturer": "Yageo", "package": "0402", "description": "4.7kΩ I2C SDA pull-up", "quantity": 1, "footprint": "Resistor_SMD:R_0402_1005Metric"},
      {"ref": "R4", "mpn": "RC0402FR-075K1L", "manufacturer": "Yageo", "package": "0402", "description": "5.1kΩ USB CC1 resistor", "quantity": 1, "footprint": "Resistor_SMD:R_0402_1005Metric"},
      {"ref": "R5", "mpn": "RC0402FR-075K1L", "manufacturer": "Yageo", "package": "0402", "description": "5.1kΩ USB CC2 resistor", "quantity": 1, "footprint": "Resistor_SMD:R_0402_1005Metric"},
      {"ref": "H1", "mpn": "M2 Standoff", "manufacturer": "Generic", "package": "M2", "description": "M2 mounting hole", "quantity": 1, "footprint": "MountingHole:MountingHole_2.2mm_M2_DIN965"},
      {"ref": "H2", "mpn": "M2 Standoff", "manufacturer": "Generic", "package": "M2", "description": "M2 mounting hole", "quantity": 1, "footprint": "MountingHole:MountingHole_2.2mm_M2_DIN965"},
      {"ref": "H3", "mpn": "M2 Standoff", "manufacturer": "Generic", "package": "M2", "description": "M2 mounting hole", "quantity": 1, "footprint": "MountingHole:MountingHole_2.2mm_M2_DIN965"},
      {"ref": "H4", "mpn": "M2 Standoff", "manufacturer": "Generic", "package": "M2", "description": "M2 mounting hole", "quantity": 1, "footprint": "MountingHole:MountingHole_2.2mm_M2_DIN965"}
    ]
    
    bom_path = os.path.join(output_dir, "bom.json")
    with open(bom_path, "w") as f:
        json.dump(bom, f, indent=2)
        
    sch_path = os.path.join(output_dir, "schematic.kicad_sch")
    generate_schematic(sch_path)
    
    pcb_path = os.path.join(output_dir, "board.kicad_pcb")
    generate_pcb(pcb_path)
    
    pro_path = os.path.join(output_dir, "project.kicad_pro")
    with open(pro_path, "w") as f:
        f.write('{"board": {"design_settings": {}}}')
        
    gerbers_dir = os.path.join(output_dir, "gerbers")
    os.makedirs(gerbers_dir, exist_ok=True)
    
    try:
        subprocess.run(["kicad-cli", "pcb", "export", "gerbers", "--output", gerbers_dir, pcb_path], check=True)
    except Exception as e:
        print("Gerber export failed:", e)
        
    zip_path = os.path.join(output_dir, "pcb_project.zip")
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zf:
        zf.write(bom_path, os.path.basename(bom_path))
        zf.write(sch_path, os.path.basename(sch_path))
        zf.write(pcb_path, os.path.basename(pcb_path))
        zf.write(pro_path, os.path.basename(pro_path))
        for root, dirs, files in os.walk(gerbers_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, output_dir)
                zf.write(abs_path, rel_path)
                
    return {
        "bom": bom,
        "sch": sch_path,
        "pcb": pcb_path,
        "gerbers": gerbers_dir,
        "zip": zip_path
    }
