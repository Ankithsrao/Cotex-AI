import { z } from "zod"
import { getModel } from "../config/llmModel.js"
import { generatePpt } from "../utils/generatePpt.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js"

const presentationSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string(),
    slides: z.array(z.object({
        title: z.string().min(1),
        points: z.array(z.string().min(1)).min(4).max(6)
    })).length(6)
})

export const pptAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "ppt")
        const llm = await getModel("ppt")
        const presentation = await llm.withStructuredOutput(presentationSchema).invoke(`
        Create a professional presentation about the topic below.
        Include a title, a concise subtitle, and exactly 6 content slides.
        Each slide must have a concise title and 4-6 concise bullet points.

        Topic:
        ${state.prompt}
    `)
        const pptBuffer = await generatePpt(presentation)
        await deductCredits(state.userId, "ppt")
        const fileName = `${presentation.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim() || "presentation"}.pptx`

        return {
            ...state,
            aiResponse: `# Presentation Generated\n\n**${presentation.title}**\n\nDownload the PowerPoint from the Artifacts section.`,
            artifacts: [{
                id: Date.now(),
                type: "PPT",
                title: presentation.title,
                files: [{
                    name: fileName,
                    content: pptBuffer.toString("base64")
                }]
            }]
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.data?.message || "failed to generate ppt"
        }
    }
}