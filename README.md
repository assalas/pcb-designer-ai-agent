# PCB Designer AI Agent

End-to-End PCB Design Assistant powered by LLMs.
This project has been ported to **Anna OS** as a seamless, browser-based hardware design environment!

## How it works

The agent takes a natural-language description (e.g., "Design a board with an ESP32, an IMU sensor, a LiPo battery charger, a USB-C port, a 3.3V LDO, and an SD card slot"), and automatically:
1. Parses the requirements using an LLM (or a fallback keyword scanner).
2. Maps keywords to real physical components (BOM generation).
3. Synthesizes a schematic netlist.
4. Generates standard IPC footprint geometries (SOIC, LQFP, SOT-223, USB-C, etc.).
5. Renders a complete, routing-ready `.kicad_pcb` board file directly in the browser!

## Running the App locally

To run the UI and the backend locally:

```bash
# 1. Start the Anna App developer sandbox
cd anna-app
anna-app dev
```

This will spin up a local UI at `http://localhost:5173` (or similar).

### Using Local LLMs (No Tokens Needed!)

If you do not have Anna OS quota (tokens), the agent gracefully falls back to a built-in keyword scanner. However, you can configure Anna OS to route LLM generation requests to your own local models!

1. Download [LM Studio](https://lmstudio.ai/) or [Ollama](https://ollama.com/).
2. Load a model (like Llama 3) and start the local Inference Server on port `1234` or `11434`.
3. Configure your local Anna runtime to point to your local endpoint!

## Running the Reef Evaluation Harness

We include a local testing harness powered by [Reef](https://github.com/reef-ai) to evaluate how well different LLMs extract footprint package parameters from PDF datasheets.

```bash
cd reef_harness
reef serve -c serve.yaml
```

## Contributing

PRs welcome. Priority areas:
- Datasheet parsers and CV feature extractors
- SKiDL schematic reference circuit templates
- Freerouting DSN/SES integration

## License

Dual-licensed:
- Non-commercial, open-source use granted under the Custom License in `LICENSE`.
- Commercial/enterprise use requires prior written authorisation from the author. Contact: assalas@tutamail.com.
