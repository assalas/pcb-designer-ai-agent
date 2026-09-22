import { AnnaAppRuntime } from "/static/anna-apps/_sdk/latest/index.js";

const EXECUTA_HANDLE = "pcb-designer";
const DEV_FALLBACK_TOOL_ID = "tool-assalas-pcb-designer-nefeer3m";
const TOOL_ID = window.__ANNA_TOOL_IDS__?.[EXECUTA_HANDLE] || DEV_FALLBACK_TOOL_ID;

async function main() {
  const statusBadge = document.getElementById("status-badge");
  const statusText = document.getElementById("status-text");
  const fileList = document.getElementById("file-list");
  const runBtn = document.getElementById("run-demo-btn");

  let anna;
  try {
    anna = await AnnaAppRuntime.connect();
    await anna.window.set_title({ title: "PCB Designer Dashboard" });
  } catch (e) {
    statusText.textContent = "Standalone preview (not running inside Anna).";
    return;
  }

  function setStatus(state, msg) {
    statusBadge.className = `badge ${state}`;
    statusBadge.textContent = state.toUpperCase();
    statusText.textContent = msg;
  }

  runBtn.addEventListener("click", async () => {
    const promptText = document.getElementById("prompt-input").value || document.getElementById("prompt-input").placeholder;
    const fullPrompt = promptText;

    runBtn.disabled = true;
    setStatus("running", "Executing full pipeline...");
    fileList.innerHTML = `<li class="empty-state">Processing... this may take 30-60 seconds.</li>`;
    
    try {
      const out = await anna.tools.invoke({
        tool_id: TOOL_ID,
        method: "full_pipeline",
        args: {
          description: fullPrompt
        },
      });
      
      setStatus("success", "Pipeline completed successfully!");
      
      const result = out || {};
      fileList.innerHTML = "";
      
      if (result.analysis_report) {
         const li = document.createElement("li");
         li.textContent = "📄 Engineering Report Generated";
         fileList.appendChild(li);
      }

      // Render clickable mock files for standard outputs
      const files = ["board.kicad_pcb", "schematic.kicad_sch", "bom.json"];
      const zip = new window.JSZip();
      const folder = zip.folder("pcb_project");
      
      files.forEach(f => {
        let content = "";
        
        function generatePads(pkg) {
            let pads = "";
            if (pkg.includes("SOIC-8")) {
                // 8 pads, 1.27mm pitch
                for(let i=0; i<4; i++) {
                    pads += `    (pad "${i+1}" smd rect (at -2.7 ${-1.905 + i*1.27}) (size 1.5 0.6) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    pads += `    (pad "${8-i}" smd rect (at 2.7 ${-1.905 + i*1.27}) (size 1.5 0.6) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("LQFP-48")) {
                // 48 pads, 0.5mm pitch
                for(let i=0; i<12; i++) {
                    let offset = -2.75 + i*0.5;
                    pads += `    (pad "${i+1}" smd rect (at -4.5 ${offset}) (size 1.2 0.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    pads += `    (pad "${i+13}" smd rect (at ${offset} 4.5) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    pads += `    (pad "${36-i}" smd rect (at 4.5 ${offset}) (size 1.2 0.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    pads += `    (pad "${48-i}" smd rect (at ${offset} -4.5) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("Module")) { // ESP32
                // 38 pins total: 19 on left, 19 on right, 1.27mm pitch
                pads += `    (fp_line (start -9 -12.5) (end 9 -12.5) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start 9 -12.5) (end 9 12.5) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start 9 12.5) (end -9 12.5) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start -9 12.5) (end -9 -12.5) (layer "F.SilkS") (width 0.12))\n`;
                for(let i=0; i<19; i++) {
                    let yOffset = -11.43 + i*1.27;
                    pads += `    (pad "${i+1}" smd rect (at -8.5 ${yOffset}) (size 2 0.9) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    pads += `    (pad "${38-i}" smd rect (at 8.5 ${yOffset}) (size 2 0.9) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("SOT-223")) {
                // 3 small pads on one side, 1 large thermal tab on the other
                pads += `    (pad "1" smd rect (at -2.3 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                pads += `    (pad "2" smd rect (at 0 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                pads += `    (pad "3" smd rect (at 2.3 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                pads += `    (pad "4" smd rect (at 0 -3.1) (size 3.3 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
            } else if (pkg.includes("USB-C")) {
                // Row of 16 fine pitch pads + 4 mechanical shield through holes
                for(let i=0; i<16; i++) {
                    pads += `    (pad "A${i+1}" smd rect (at ${-3.75 + i*0.5} 3) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
                pads += `    (pad "S1" thru_hole oval (at -4.3 0) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                pads += `    (pad "S2" thru_hole oval (at 4.3 0) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                pads += `    (pad "S3" thru_hole oval (at -4.3 -4) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                pads += `    (pad "S4" thru_hole oval (at 4.3 -4) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
            } else if (pkg.includes("SMD") && pkg.toLowerCase().includes("sd")) { // MicroSD
                // 8 pads for SD card interface
                for(let i=0; i<8; i++) {
                    pads += `    (pad "${i+1}" smd rect (at ${-3.85 + i*1.1} 5) (size 0.7 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
                pads += `    (fp_line (start -7 7) (end 7 7) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start 7 7) (end 7 -8) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start 7 -8) (end -7 -8) (layer "F.SilkS") (width 0.12))\n`;
                pads += `    (fp_line (start -7 -8) (end -7 7) (layer "F.SilkS") (width 0.12))\n`;
            } else {
                // generic 2-pin SMD (0805)
                pads += `    (pad "1" smd rect (at -0.95 0) (size 0.9 1.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                pads += `    (pad "2" smd rect (at 0.95 0) (size 0.9 1.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
            }
            return pads;
        }

        if (f.endsWith(".kicad_pcb")) {
            let pcbContent = `(kicad_pcb (version 20211014) (generator pcbnew) (general) (paper "A4")\n`;
            if (result.netlist && result.netlist.netlist && result.netlist.netlist.components) {
                result.netlist.netlist.components.forEach((comp, idx) => {
                    const x = 100 + (idx * 25); // increased spacing to 25mm to fit ESP32
                    const y = 100;
                    pcbContent += `  (footprint "${comp.package}" (layer "F.Cu") (tedit 0) (at ${x} ${y})\n`;
                    pcbContent += `    (descr "${comp.mpn}")\n`;
                    pcbContent += `    (fp_text reference "${comp.ref}" (at 0 -15) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))\n`;
                    pcbContent += `    (fp_text value "${comp.mpn}" (at 0 15) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))\n`;
                    pcbContent += generatePads(comp.package || comp.mpn);
                    pcbContent += `  )\n`;
                });
            }
            pcbContent += `)\n`;
            content = pcbContent;
        } else if (f.endsWith(".kicad_sch")) {
            content = `(kicad_sch (version 20211123) (generator eeschema)\n  (paper "A4")\n)`;
        } else {
            content = JSON.stringify(result.bom || {}, null, 2);
        }
        
        folder.file(f, content);
      });

      // Render footprints into the zip based on BOM
      if (result.bom && result.bom.bom) {
        result.bom.bom.forEach(comp => {
          if (comp.mpn && comp.mpn !== "UNKNOWN") {
            const f = `footprints/${comp.mpn}.kicad_mod`;
            
            let content = `(footprint "${comp.mpn}" (layer "F.Cu") (tedit 0)\n`;
            content += `  (descr "Auto-generated footprint for ${comp.mpn}")\n`;
            content += `  (fp_text reference "REF**" (at 0 -15) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))\n`;
            content += `  (fp_text value "${comp.mpn}" (at 0 15) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))\n`;
            
            // Reuse the exact same pad logic! We can execute it inline because of how we scoped it, 
            // wait, we defined generatePads() inside the upper loop. We'll duplicate it here safely.
            let pkg = comp.package || comp.mpn;
            if (pkg.includes("SOIC-8")) {
                for(let i=0; i<4; i++) {
                    content += `  (pad "${i+1}" smd rect (at -2.7 ${-1.905 + i*1.27}) (size 1.5 0.6) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    content += `  (pad "${8-i}" smd rect (at 2.7 ${-1.905 + i*1.27}) (size 1.5 0.6) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("LQFP-48")) {
                for(let i=0; i<12; i++) {
                    let offset = -2.75 + i*0.5;
                    content += `  (pad "${i+1}" smd rect (at -4.5 ${offset}) (size 1.2 0.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    content += `  (pad "${i+13}" smd rect (at ${offset} 4.5) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    content += `  (pad "${36-i}" smd rect (at 4.5 ${offset}) (size 1.2 0.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    content += `  (pad "${48-i}" smd rect (at ${offset} -4.5) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("Module")) { 
                content += `  (fp_line (start -9 -12.5) (end 9 -12.5) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start 9 -12.5) (end 9 12.5) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start 9 12.5) (end -9 12.5) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start -9 12.5) (end -9 -12.5) (layer "F.SilkS") (width 0.12))\n`;
                for(let i=0; i<19; i++) {
                    let yOffset = -11.43 + i*1.27;
                    content += `  (pad "${i+1}" smd rect (at -8.5 ${yOffset}) (size 2 0.9) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                    content += `  (pad "${38-i}" smd rect (at 8.5 ${yOffset}) (size 2 0.9) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
            } else if (pkg.includes("SOT-223")) {
                content += `  (pad "1" smd rect (at -2.3 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                content += `  (pad "2" smd rect (at 0 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                content += `  (pad "3" smd rect (at 2.3 3.1) (size 1.2 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                content += `  (pad "4" smd rect (at 0 -3.1) (size 3.3 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
            } else if (pkg.includes("USB-C")) {
                for(let i=0; i<16; i++) {
                    content += `  (pad "A${i+1}" smd rect (at ${-3.75 + i*0.5} 3) (size 0.3 1.2) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
                content += `  (pad "S1" thru_hole oval (at -4.3 0) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                content += `  (pad "S2" thru_hole oval (at 4.3 0) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                content += `  (pad "S3" thru_hole oval (at -4.3 -4) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
                content += `  (pad "S4" thru_hole oval (at 4.3 -4) (size 1.2 2) (drill oval 0.6 1.4) (layers *.Cu *.Mask))\n`;
            } else if (pkg.includes("SMD") && pkg.toLowerCase().includes("sd")) { 
                for(let i=0; i<8; i++) {
                    content += `  (pad "${i+1}" smd rect (at ${-3.85 + i*1.1} 5) (size 0.7 1.5) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                }
                content += `  (fp_line (start -7 7) (end 7 7) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start 7 7) (end 7 -8) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start 7 -8) (end -7 -8) (layer "F.SilkS") (width 0.12))\n`;
                content += `  (fp_line (start -7 -8) (end -7 7) (layer "F.SilkS") (width 0.12))\n`;
            } else {
                content += `  (pad "1" smd rect (at -0.95 0) (size 0.9 1.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
                content += `  (pad "2" smd rect (at 0.95 0) (size 0.9 1.3) (layers "F.Cu" "F.Paste" "F.Mask"))\n`;
            }
            content += `  (attr smd)\n)`;
            folder.file(f, content);
          }
        });
      }

      // Generate the ZIP and create a single download link
      zip.generateAsync({type:"blob"}).then(function(content) {
          const li = document.createElement("li");
          const a = document.createElement("a");
          a.className = "file-link";
          a.href = URL.createObjectURL(content);
          a.download = "pcb_project.zip";
          a.textContent = "📦 Download PCB Project Folder (.zip)";
          a.style.fontWeight = "bold";
          a.style.color = "#0056b3";
          li.appendChild(a);
          fileList.appendChild(li);
      });
      
    } catch (e) {
      setStatus("error", `Error: ${e.message}`);
    } finally {
      runBtn.disabled = false;
    }
  });
}

main();
