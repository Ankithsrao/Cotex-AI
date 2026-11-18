import api from "../../utils/axios"


async function sendMessage(payload) {
    let body = payload
    if (payload.file) {
        body = new FormData()
        body.append("prompt", payload.prompt)
        body.append("conversationId", payload.conversationId)
        body.append("agent", payload.agent)
        body.append("file", payload.file)
    }

    const {data} = await api.post("/api/agent/chat",body)
    return data
}

export default sendMessage