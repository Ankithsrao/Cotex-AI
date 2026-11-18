import Conversation from "../models/conversation.model.js"
import Message from "../models/message.modal.js"

export const createConversation = async (req,res) => {
    try {
        const userId = req.get("x-user-id")
        if (!userId) {
            return res.status(401).json({ message: "Missing user ID" })
        }
        console.log("userId",userId)
        const conversation = await Conversation.create({
            userId:userId
        })

        return res.status(200).json(conversation)
    } catch (error) {
         return res.status(500).json({message:`create conversation error ${error}`})
    }
}

export const getConversations = async (req,res) => {
    try {
        const userId = req.get("x-user-id")
        if (!userId) {
            return res.status(401).json({ message: "Missing user ID" })
        }
        console.log("userId",userId)
        const conversations = await Conversation.find({
            userId:userId
        }).sort({updatedAt:-1})

        return res.status(200).json(conversations)
    } catch (error) {
         return res.status(500).json({message:`get conversation error ${error}`})
    }
}

export const updateConversation = async (req,res) => {
    try {
        const {id,title} = req.body
        const userId = req.get("x-user-id")
        if (!userId) {
            return res.status(401).json({ message: "Missing user ID" })
        }
        if (typeof id !== "string" || !id || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "A conversation ID and non-empty title are required" })
        }

        const conversation = await Conversation.findOneAndUpdate(
            { _id: id, userId },
            { title: title.trim() },
            { new: true, runValidators: true }
        )
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" })
        }

        return res.status(200).json(conversation)
    } catch (error) {
         console.error("Update conversation error:", error)
         return res.status(500).json({message:`update conversation error ${error.message}`})
    }
}


export const saveMessage=async (req,res)=>{
    try {
        const {conversationId,role,content,images,artifacts}= req.body
        const message = await Message.create({
            conversationId,
            content,
            role,
            images,
            artifacts
        })
        return res.status(200).json(message)
    } catch (error) {
        return res.status(500).json({message:`save message error ${error}`})
    }
}

export const getMessage=async (req,res)=>{
    try {
        
        const messages = await Message.find({
            conversationId:req.params.conversationId
        })
        return res.status(200).json(messages)
    } catch (error) {
        return res.status(500).json({message:`get messages error ${error}`})
    }
}