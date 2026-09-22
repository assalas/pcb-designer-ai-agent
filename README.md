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

### Using Local LLMs & Cloud Providers (Bring Your Own Key)

If you do not have Anna OS quota (tokens), you can bypass the Anna OS sampling system completely by setting environment variables to use your own API keys for Gemini, Claude, or OpenAI, or you can use local models like LM Studio and Ollama.

**To use Gemini:**
```bash
export PCB_AI_LLM_PROVIDER=gemini
export GEMINI_API_KEY=your_api_key_here
export PCB_AI_MODEL=gemini-3.6-flash  # or gemini-1.5-pro
```

**To use Anthropic (Claude):**
```bash
export PCB_AI_LLM_PROVIDER=claude
export ANTHROPIC_API_KEY=your_api_key_here
export PCB_AI_MODEL=claude-3-5-sonnet-20240620
```

**To use OpenAI:**
```bash
export PCB_AI_LLM_PROVIDER=openai
export OPENAI_API_KEY=your_api_key_here
export PCB_AI_MODEL=gpt-4o-mini
```

**To use Local Models (LM Studio / Ollama):**
```bash
export PCB_AI_LLM_PROVIDER=lmstudio  # or ollama
```

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
