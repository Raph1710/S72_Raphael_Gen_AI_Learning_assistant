import dotenv from "dotenv";
import { askGemini } from "./services/aiService.js";

dotenv.config();

const res = await askGemini("Say hello in one short sentence.");
console.log(res);
