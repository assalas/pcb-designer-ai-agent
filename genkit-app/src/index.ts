import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/google-genai";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// Initialize Genkit with the Google AI plugin
const ai = genkit({
  plugins: [googleAI()],
  model: 'googleai/gemini-flash-latest', 
});

// Define the exact schema we expect Gemini to output
const PCBRequirementSchema = z.object({
  keywords: z.array(z.string()).describe("List of component keywords like mcu, ldo, sensor, bluetooth"),
  voltage: z.string().describe("Voltage requirements"),
  current: z.string().describe("Current requirements"),
  connectivity: z.array(z.string()).describe("Connectivity types like bluetooth, wifi"),
  mcu: z.string().describe("Preferred MCU family"),
  notes: z.string().describe("Engineering analysis and constraints"),
});

// Define the main Genkit Flow
export const pcbDesignFlow = ai.defineFlow(
  {
    name: "designPCB",
    inputSchema: z.object({ description: z.string() }),
    outputSchema: PCBRequirementSchema,
  },
  async (input) => {
    console.log(`[Genkit] Received Prompt: ${input.description}`);

    // 1. Use Gemini 1.5 Flash to parse the unstructured hardware description into typed JSON
    const { output } = await ai.generate({
      prompt: `You are an expert hardware engineer. Extract structured component requirements from the following natural language description.\n\nDescription: ${input.description}`,
      output: { schema: PCBRequirementSchema },
    });

    console.log("[Genkit] Gemini Extracted JSON:", JSON.stringify(output, null, 2));

    return output;
  }
);

// Start the Genkit flow server
// ai.startFlowServer({
//   flows: [pcbDesignFlow],
// });
