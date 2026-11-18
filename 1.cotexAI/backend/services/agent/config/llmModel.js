import dotenv from "dotenv"
import { fileURLToPath } from "node:url"
import { ChatGroq } from "@langchain/groq"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { ChatOpenRouter } from "@langchain/openrouter";

// Fix path: if .env is in backend/services/agent/.env, use "../.env"
dotenv.config({ path: fileURLToPath(new URL("../.env", import.meta.url)) })

const groq = new ChatGroq({
    model: "openai/gpt-oss-120b",
    maxTokens: 1024,
})

const ppt = new ChatGroq({
    model: "openai/gpt-oss-120b",
    maxTokens: 4096,
})

const gemini = new ChatGoogleGenerativeAI({
    model: "gemini-3.8-flash"
})

const openrouter = new ChatOpenRouter({
    model: "deepseek/deepseek-chat",
    temperature: 0,
    maxTokens: 2500
})

export const getModel = (agent) => {
    switch (agent) {
        case "chat":
        case "search":
            return groq;
        case "ppt":
            return ppt;
        case "coding":
            return openrouter;
        case "gemini":
            return gemini;
        case "imageAnalyzer":
            return gemini;
        default:
            return groq;
    }
}