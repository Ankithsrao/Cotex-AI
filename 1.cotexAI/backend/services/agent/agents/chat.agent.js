import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages"
import { getModel } from "../config/llmModel.js"
import { getMemeory } from "../config/memory.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js"

const MAX_CONTEXT_CHARS = 15000
const MAX_SEARCH_CONTEXT_CHARS = 4000

export const chatAgent =async (state) => {

    
    try {
        
        await checkAgentLimit(state.userId, "chat")
        const llm = getModel(state.agent || "chat")

    const history=await getMemeory(state.conversationId)
    const agentInstructions = {
        coding: "Act as a coding assistant. Help design, explain, debug, and write code. Use fenced code blocks for code.",
        pdf: "Act as a document assistant. Help draft, organize, and explain PDF/document content. Be clear if the user needs to provide a document to analyze.",
        ppt: "Act as a presentation assistant. Help create slide outlines and concise slide content, organized by slide.",
        vision: "Act as an image assistant. Answer image-related requests and ask the user to attach an image when visual context is needed."
    }
    const modeInstruction = agentInstructions[state.agent] || ""

    const searchResults = state.searchResults
        ? JSON.stringify({
            results: (Array.isArray(state.searchResults.results) ? state.searchResults.results : [])
                .map(({ title, url, content }) => ({
                    title,
                    url,
                    content: typeof content === "string" ? content.slice(0, 700) : ""
                }))
        }).slice(0, MAX_SEARCH_CONTEXT_CHARS)
        : ""
    const searchContext=searchResults?`Web Search Results:
    ${searchResults}
    
    Answer the user using only the above search results.
    `:""

    const systemprompt = `
    You are CotexAI, an intelligent AI assistant.

    ${modeInstruction}

    ${searchContext}

    If searchContext exists:

    - Use search results to answer.
    - Do not mention internal tools.

    Rules:

    - For simple questions, greeting,and short queries, respond naturally in plain
    text
    - For technical, educational, coding, or detailed topics, use clean Markdown
    Formatting:
    
    - Use # for title and ## sections.
    - Leave a blank line after headings.
    - Use bullet points for lists.
    - Use numbered list for steps.
    - Use fence code block with languages tags for code
    - Keep paragraphs shots and readable
    - Never write headings and content on same line
    - Never generate large walls of text.
`

    const historyBudget = Math.max(0, MAX_CONTEXT_CHARS - systemprompt.length)
    const recentHistory = []
    let remainingChars = historyBudget

    for (let index = history.length - 1; index >= 0 && remainingChars > 0; index -= 1) {
        const message = history[index]
        if (message.role !== "user" && message.role !== "assistant") continue

        const content = typeof message.content === "string" ? message.content : ""
        if (content.length > remainingChars) {
            if (index === history.length - 1) {
                recentHistory.unshift({ role: message.role, content: content.slice(0, remainingChars) })
            }
            break
        }

        recentHistory.unshift({ role: message.role, content })
        remainingChars -= content.length
    }

    const messages = [new SystemMessage(systemprompt)]
    recentHistory.forEach(({ role, content }) => {
        messages.push(role === "user" ? new HumanMessage(content) : new AIMessage(content))
    })

    
    const response = await llm.invoke(messages)
    await deductCredits(state.userId,"chat")
    
    return {
        ...state,
        aiResponse:response.content
    }
    } catch (error) {
        console.error("Chat agent failed:", error)
        throw error
    }
    
}