import { Code2, FileText, Globe, ImageIcon, MessageSquare, Mic, Paperclip, Presentation, Send, X, Zap } from "lucide-react"
import { useRef, useState } from "react"
import sendMessage from "../src/features/sendMessage"
import { useDispatch, useSelector } from "react-redux"
import { addMessage, setArtifacts, setIsLoading } from "../src/redux/messageSlice"
import { createConversation } from "../src/features/createConversation"
import { addConversation, setConvTitle, setSelectConversation } from "../src/redux/conversationsSlice"
import { updateConversation } from "../src/features/updateConversations"
import getCurrentUser from "../src/features/getCurrentUser"
import { setUserData } from "../src/redux/userSlice"


const ChatInput = ({ onLoadingChange }) => {
    const [value, setvalue] = useState("")
    const [selectedAgent, setSelectedAgent] = useState("auto")
    const [sending, setSending] = useState(false)
    const [sendError, setSendError] = useState("")
    const { selectedConversation } = useSelector(state => state.conversation)
    const userData = useSelector(state => state.user.userData)
    const dispatch = useDispatch()
    const [selectedFile,setSelectedFile]=useState(null)
    const fileRef=useRef(null)
    const handleSendMessage = async () => {
        dispatch(setIsLoading(true))
        const prompt = value.trim() || (
            selectedFile?.type === "application/pdf"
                ? "Summarize this PDF."
                : selectedFile
                    ? "Analyze this image."
                    : ""
        )
        if (!prompt || sending) return

        setSending(true)
        onLoadingChange(true)
        setSendError("")
        try {
            let conversation = selectedConversation
            if (!conversation) {
                conversation = await createConversation()
                if (!conversation?._id) {
                    throw new Error("Could not create a conversation. Please try again.")
                }
                dispatch(setSelectConversation(conversation))
                dispatch(addConversation(conversation))
            }

            if (conversation.title === "New Chat") {
                const updatedConversation = await updateConversation({ id: conversation._id, title: prompt })
                if (!updatedConversation?._id) {
                    throw new Error("Could not update the conversation title. Please try again.")
                }
                dispatch(setConvTitle({ conversationId: conversation._id, title: prompt }))
            }

            const data = await sendMessage({
                prompt,
                conversationId: conversation._id,
                agent: selectedAgent,
                file: selectedFile
            })
            setSelectedFile(null)
            const answer = typeof data === "string" ? data : data?.answer
            if (typeof answer !== "string" || !answer.trim()) {
                throw new Error("The agent returned an empty response. Please try again.")
            }

            dispatch(addMessage({ role: "user", content: prompt }))
            dispatch(setIsLoading(false))
            dispatch(addMessage({
                role: "assistant",
                content: answer,
                images: typeof data === "object" ? data.images || [] : [],
                artifacts: typeof data === "object" ? data.artifacts || [] : []
            }))
            setvalue("")
            setSelectedFile(null)
            if (fileRef.current) fileRef.current.value = ""
            dispatch(setArtifacts(data.artifacts || []))
        } catch (error) {
            setSendError(error.response?.data?.message || error.message || "Unable to send your message.")
        } finally {
            setSending(false)
            onLoadingChange(false)
            const refreshedUser = await getCurrentUser()
            if (refreshedUser) {
                dispatch(setUserData({
                    ...userData,
                    ...refreshedUser,
                    avatar: refreshedUser.avatar || userData?.avatar || null
                }))
            }
        }
    }

    const agents = [
        {
            id: "auto",
            icon: Zap,
            label: "Auto"
        },
        {
            id: "chat",
            icon: MessageSquare,
            label: "Chat"
        },
        {
            id: "coding",
            icon: Code2,
            label: "Coding"
        },
        {
            id: "pdf",
            icon: FileText,
            label: "PDF"
        },
        {
            id: "ppt",
            icon: Presentation,
            label: "PPT"
        },
        {
            id: "vision",
            icon: ImageIcon,
            label: "Vision"
        },
        {
            id: "search",
            icon: Globe,
            label: "Search"
        },

    ]

    return (
        <div className='w-full overflow-hidden px-3 mb:px-5 py-4 border-t
    border-white/6 bg-[#0d0f14]'>
            <div className="flex flex-col gap-2 bg-white/3 border border-white/7
        rounded-2xl px-4 pt-3.5 pb-3">

                <div className="flex w-[80%] gap-2 pr-2 flex-wrap">
                    {agents.map((agent) => {
                        const isActive = selectedAgent === agent.id
                        const Icon = agent.icon
                        return (
                            <button
                                key={agent.id}
                                type="button"
                                onClick={() => setSelectedAgent(agent.id)}
                                aria-pressed={isActive}
                                className={`shrink-0 cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium
                        border transition-all ${isActive ? "bg-linear-to-r from-indigo-500 to-violet-600 text-white border-transparent shadow-[0_1px_8px_rgba(99,102,241,35)]" : "bg-white/3 text-slate-400 border-white/6 hover:bg-white/7"}`}>
                                <Icon size={14} className={isActive ? "text-white" : "text-slate-500"} />

                                {agent.label}
                            </button>
                        )
                    })}
                </div>

                {selectedFile && (
                    <div className='my-3'>
                        <div className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2">
                            {selectedFile?.type === "application/pdf" ? (
                                <FileText size={16} className="text-red-400" />
                            ) : selectedFile?.type?.startsWith("image/") ? (
                                <img
                                    src={URL.createObjectURL(selectedFile)}
                                    alt="Selected file preview"
                                    className="h-10 w-10 rounded-xl object-cover mt-3"
                                />
                            ) : null}

                            <div>
                            <p className="text-xs text-white">
                                {selectedFile?.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                                {Math.ceil(selectedFile.size)}KB
                            </p>
                        </div>
                        <button
                            className="ml-2"
                            type="button"
                            onClick={() => {
                                setSelectedFile(null)
                                if (fileRef.current) fileRef.current.value = ""
                            }}
                        >
                            <X size={14} className="text-slate-500 hover:text-white" />
                        </button>
                    </div>
                        </div>

                        

                    
                )}
                <textarea
                    placeholder="Ask Anything..."
                    onChange={(e) => setvalue(e.target.value)}
                    value={value}
                    disabled={sending}
                    className="w-full bg-transparent outline-none text-[14px] text-slate-200
            placeholder:text-slate-600 leading-relaxed scrollbar-none [&::-webkit-scrollbar]:hidden
            disabled:opacity-50 resize-none"
                    row={3}
                />
                <div className='flex items-center justify-between'>
                    <div className="flex items-center gap-1">

                        <input type="file" accept=".pdf,image/*" hidden ref={fileRef} onChange={(e)=>{
                            const file=e.target.files[0]
                            if(file){
                                setSelectedFile(file)
                            }
                        }}/>
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600
                    hover:text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/6
                    transition-all duration-150 bg-transparent cursor-pointer" onClick={()=>fileRef.current.click()}>
                            <Paperclip size={16} />
                        </button>
                        <button className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600
                    hover:text-slate-400 hover:bg-white/5 border border-transparent hover:border-white/6
                    transition-all duration-150 bg-transparent cursor-pointer">
                            <Mic size={16} />
                        </button>
                    </div>
                    <button
                        disabled={(!value.trim() && !selectedFile) || sending}
                        onClick={handleSendMessage}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg border-none cursor-pointer
                transition-all duration-150 ${value.trim() || selectedFile ? "bg-linear-to-br from-indigo-500 to-violet-700 hover:opacity-90 text-white" : "bg-white/5 text-slate-600 cursor-not-allowed"}`}>
                        <Send size={15} />
                    </button>
                </div>
                {sendError && (
                    <p role="alert" className="text-sm text-red-400">
                        {sendError}
                    </p>
                )}
            </div>
        </div>
    )
}

export default ChatInput