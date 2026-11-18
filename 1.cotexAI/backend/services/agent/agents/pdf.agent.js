import { z } from "zod"
import { getModel } from "../config/llmModel.js"
import { generatePdf } from "../utils/generatePdf.js"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js"

const pdfSchema = z.object({
    title: z.string().min(1),
    subtitle: z.string(),
    sections: z.array(z.object({
        heading: z.string().min(1),
        points: z.array(z.string().min(1)).min(3).max(6)
    })).min(4).max(8)
})

export const pdfAgent = async (state) => {
    try {
        await checkAgentLimit(state.userId, "pdf")
        const llm = await getModel("pdf")
        const data = await llm.withStructuredOutput(pdfSchema).invoke(`
            Create a document with a title, subtitle, and 4-8 sections.
            Each section must have a heading and 3-6 concise bullet points.

            Topic:
            ${state.prompt}
        `)
        await deductCredits(state.userId, "pdf")
        const pdfBuffer = await generatePdf(data)
        const fileName = `${data.title.replace(/[<>:"/\\|?*\x00-\x1F]/g, "-").trim() || "generated-document"}.pdf`

        return {
            ...state,
            aiResponse: `# PDF Generated\n\n**${data.title}**\n\nUse the download button below to save your PDF.`,
            artifacts: [{
                id: Date.now(),
                type: "PDF",
                title: data.title,
                files: [{
                    name: fileName,
                    content: pdfBuffer.toString("base64")
                }]
            }]
        }
    } catch (error) {
        console.log(error)
        return {
            ...state,
            aiResponse: error?.data?.message || "failed to generate pdf"
        }
    }
}