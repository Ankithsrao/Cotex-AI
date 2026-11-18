import { getModel } from "../config/llmModel.js"

export const router = async (state) => {

    const selectedAgent = state.agent?.trim().toLowerCase()
    const agentAliases = { image: "vision" }
    const validAgents = ["chat", "search", "coding", "pdf", "ppt", "vision"]
    if (selectedAgent && selectedAgent !== "auto") {
        const agent = agentAliases[selectedAgent] || selectedAgent
        if (!validAgents.includes(agent)) {
            throw new Error(`Unsupported agent: ${state.agent}`)
        }
        return { ...state, agent }
    }

    if (state.file?.mimetype === "application/pdf") {
        return{
            ...state,
            agent:"pdfRag"
        }
    }

    if (state.file?.mimetype?.startsWith("image/")) {
        return{
            ...state,
            agent:"imageAnalyzer"
        }
    }

    
    
    
    const llm = await getModel("router")
    const prompt = `You are an agent router.
    
Available agents:

- chat
- search
- coding
- pdf
- ppt
- vision

Rules:

chat:
General conversation,
explanations,
learning,
questions,

search:
Current events
latest information,
news,
recent development,
internet lookup.

coding:
Generate code,
debug code,
build projects,
architecture,
API design.

pdf:
Questions about generate PDF's 
or document content.

ppt:
Questions about generate ppts
or ppt content.

vision:
Generate code,
create image,



Return ONLY one word:

chat
search
coding
pdf
ppt
vision

User Query:
${state.prompt}
`

    const response = await llm.invoke(prompt)

    return {
        ...state,
        agent: response.content
        .trim()
        .toLowerCase()
    }

}
