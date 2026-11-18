import crypto from "crypto"
import { PLANS } from "../config/Plans.js"
import razorpay from "../config/razorpay.js"
import axios from "axios"
import Payment from "../models/payment.model.js"

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECERT
const authService = `${process.env.AUTH_SERVICE}/auth/update-plan`

export const createOrder=async (req, res)=>{
    try {
        const { plan } = req.body ?? {}
        const userId = req.get("x-user-id")
        const selectedPlan = PLANS[plan]

        if (!selectedPlan) {
            return res.status(400).json({ message: "Invalid plan" })
        }

        if (!userId) {
            return res.status(401).json({ message: "User ID is required" })
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`
        })

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        })

        return res.status(200).json({ order, plan: selectedPlan })
    } catch (error) {
        console.error("Create order error:", error)
        return res.status(500).json({ message: `Create order error: ${error.message}` })
    }
}


export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body ?? {}
        const userId = req.get("x-user-id")

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification fields" })
        }

        if (!userId) {
            return res.status(401).json({ message: "User ID is required" })
        }

        const generatedSignature = crypto
            .createHmac("sha256", razorpayKeySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex")
        const expectedSignatureBuffer = Buffer.from(razorpay_signature)
        const generatedSignatureBuffer = Buffer.from(generatedSignature)

        if (
            expectedSignatureBuffer.length !== generatedSignatureBuffer.length ||
            !crypto.timingSafeEqual(expectedSignatureBuffer, generatedSignatureBuffer)
        ) {
            return res.status(400).json({ message: "Payment verification failed" })
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id, userId })

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" })
        }

        if (payment.status === "paid") {
            return res.status(200).json({ message: "Payment already verified" })
        }

        await axios.post(authService, {
            userId: payment.userId,
            plan: payment.plan,
            credits: payment.credits
        })
        payment.status = "paid"
        payment.paymentId = razorpay_payment_id
        await payment.save()

        

        return res.status(200).json({ message: "Payment verified" })
    } catch (error) {
        console.error("Verify payment error:", error)
        return res.status(500).json({ message: `Verify payment error: ${error.message}` })
    }
}