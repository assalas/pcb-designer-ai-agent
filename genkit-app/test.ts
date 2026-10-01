import { pcbDesignFlow } from "./src/index";

async function main() {
  console.log("Calling Genkit flow programmatically...");
  try {
    const result = await pcbDesignFlow({
      description: "Design a bio-medical wearable patch that continuously monitors heart rate and blood oxygen levels (SpO2) using a MAX30102 sensor. It should stream data over Bluetooth Low Energy via a Nordic nRF52832 MCU. It needs a low-noise 1.8V LDO to power the sensor cleanly, and a tiny CR2032 coin cell battery holder for power. Space is critical."
    });
    console.log("\n✅ SUCCESS! Output:");
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
