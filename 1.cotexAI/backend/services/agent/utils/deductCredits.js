import axios from "axios"

export const deductCredits = async (userId, agent) => {
    if (!userId || !agent) {
        throw new Error("User ID and agent are required to deduct credits")
    }

    if (!process.env.AUTH_SERVICE) {
        throw new Error("AUTH_SERVICE is missing from the agent service environment")
    }

    const authServiceUrl = new URL("/auth/deduct-credits", process.env.AUTH_SERVICE)
    const { data } = await axios.post(authServiceUrl.toString(), {
        userId,
        agent
    })
    return data
}
