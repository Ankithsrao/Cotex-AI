import axios from "axios"
import { graph } from "../../graph/graph.js"
import { addMessage, getMemeory } from "../../config/memory.js"

export const agent = async (req,res,next) => {
    try {
        const {prompt,conversationId,agent} = req.body
        const file=req.file
        console.log("file",file)
        const userId=req.headers["x-user-id"]
        if (typeof prompt !== "string" || !prompt.trim() || !conversationId) {
            return res.status(400).json({message:"prompt and conversationId are required"})
        }

        await getMemeory(conversationId)
        await addMessage(conversationId,"user",prompt)

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`,{
           conversationId,role:"user",content:prompt 
        })
        const result = await graph.invoke({
            prompt,conversationId,agent,userId,file
        })
        const response = result.aiResponse
        if (typeof response !== "string" || !response.trim()) {
            throw new Error("Agent returned an empty response")
        }

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`,{
           conversationId,role:"assistant",content:response,images:result.images,artifacts:result?.artifacts
        })
        await addMessage(conversationId,"assistant",response)
        return res.status(200).json({
            answer:response,
            images:result.images,
            artifacts:result?.artifacts
        })

    } catch (error) {
        next(error)
        
    }
}
