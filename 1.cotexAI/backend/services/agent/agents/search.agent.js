import { checkAgentLimit } from "../config/agentlimit.js"
import { searchtool } from "../config/tavily.js"
import { deductCredits } from "../utils/deductCredits.js"

export const searchAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "search")

        const results = await searchtool.invoke({
            query: state.prompt
        })

        await deductCredits(state.userId, "search")

        if (results.error) {
            throw new Error(`Tavily search failed: ${results.error}`)
        }

        if (!Array.isArray(results.results) || results.results.length === 0) {
            throw new Error("Tavily search returned no results.")
        }

        const images = (Array.isArray(results.images) ? results.images : [])
            .map(image => typeof image === "string" ? image : image?.url)
            .filter(image => typeof image === "string" && image.length > 0)

        return {
            ...state,
            searchResults: results,
            images
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.data?.message || "failed to generate response"
        }
    }
}