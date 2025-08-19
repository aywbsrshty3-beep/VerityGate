// npx ts-node .\code\src\veritygate\VGService.ts

import { InMemoryDataStore } from "./VGMemoryStore";
import express from "express";

const PORT = 4000;
const app = express();

app.listen(PORT, () => {
  console.log("[VeriGate Service] is running on port", PORT);
});

const store = new InMemoryDataStore();
store.bootstrap();
