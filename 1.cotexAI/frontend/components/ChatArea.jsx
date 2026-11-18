import { useEffect, useState } from "react"
import ChatInput from "./ChatInput"
import MessageList from "./MessageList"
import Navbar from "./Navbar"
import { useDispatch, useSelector } from "react-redux"
import { setArtifacts, setMessages } from "../src/redux/messageSlice"
import getMessages from "../src/features/getMessages"

const ChatArea= () => {
  const {selectedConversation} = useSelector(state=>state.conversation)
  const [isLoading, setIsLoading] = useState(false)
  const dispatch = useDispatch()
  useEffect(()=>{
    const getMesg = async () => {
      if(!selectedConversation || selectedConversation.title === "New Chat"){
        dispatch(setMessages([]))
        dispatch(setArtifacts([]))
        return
      }
      const data = await getMessages(selectedConversation._id)
      const messages = Array.isArray(data) ? data : []
      dispatch(setMessages(messages))
      const latestArtifactsMessage = [...messages].reverse().find(
        msg => msg.artifacts?.length > 0
      )
      dispatch(setArtifacts(latestArtifactsMessage?.artifacts || []))
    }
    getMesg()
  },[dispatch, selectedConversation])
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Navbar />
      <MessageList isLoading={isLoading} />
      <ChatInput onLoadingChange={setIsLoading} />
    </div>
  )
}

export default ChatArea