import { getModel } from "../config/llmModel.js"
import axios from "axios"
import { deductCredits } from "../utils/deductCredits.js"
import { checkAgentLimit } from "../config/agentlimit.js"

export const visionAgent=async (state) =>{
    await checkAgentLimit(state.userId, "vision")
    const llm=await getModel("image")
    const res=await llm.invoke(`
        You are an elite AI image prompt engineer.

Convert the user request into a highly detailed image generation prompt.

Requirement:

- Cinematic lighting
- Professional composition
- Ultra realistic
- High detail
- Beautiful color palette
- Sharp focus
- 8K quality
- Photerealistic
- Depth of field
- Professional photography
- stunning visuals

Return only the image prompt.

User Request:
    ${state.prompt}

        `)

const prompt = res.content.trim()
if (!prompt) {
    throw new Error("The image prompt model returned an empty prompt")
}

const apiKey = process.env.POLLINATIONS_API_KEY || process.env.POOLINATION_API_KEY
if (!apiKey) {
    throw new Error("POLLINATIONS_API_KEY is missing from the agent service environment")
}

const imageUrl = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=flux`
const imageRes = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: 60000,
    headers: {
        Authorization: `Bearer ${apiKey}`
    }
})

await deductCredits(state.userId,"vision")
const contentType = imageRes.headers["content-type"]
if (!contentType?.startsWith("image/")) {
    throw new Error("Image generation service returned a non-image response")
}

const imageBuffer = Buffer.from(imageRes.data)

if (imageBuffer.length > 8 * 1024 * 1024) {
    throw new Error("Generated image exceeds the 8 MB storage limit")
}

try {
    return {
        ...state,
        aiResponse: "Image generated successfully.",
        images: [`data:${contentType};base64,${imageBuffer.toString("base64")}`],
        artifacts: []
    }
} catch (error) {
    console.error(error)
    return {
        ...state,
        aiResponse: error?.response?.data?.message || error?.message || "Failed to generate image"
    }
}
}