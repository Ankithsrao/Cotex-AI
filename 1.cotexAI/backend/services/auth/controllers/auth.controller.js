import crypto from "crypto";
import adminAuth from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../shared/redis/redis.js";
import { PLANS } from "../../billing/config/Plans.js";

const normalizeCreditsToPlan = (user) => {
    const planCredits = PLANS[user.plan]?.credits;
    if (typeof planCredits !== "number") {
        return false;
    }

    const availableCredits = Math.min(
        Number.isFinite(user.credits) ? user.credits : planCredits,
        planCredits
    );
    const changed = user.credits !== availableCredits || user.totalCredits !== planCredits;
    user.credits = availableCredits;
    user.totalCredits = planCredits;
    return changed;
};

const updateUserSession = async (user) => {
    const sessionId = await redis.get(`user-session-${user._id}`);
    if (!sessionId) {
        return;
    }

    await redis.set(`session-${sessionId}`, JSON.stringify({
        userId: user._id,
        firebaseUid: user.firebaseUid,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt
    }), "EX", 7 * 24 * 60 * 60);
};

export const login = async (req, res) => {
    try {
        const { token } = req.body;
        const decoded = await adminAuth.verifyIdToken(token);
        
        let user = await User.findOne({ firebaseUid: decoded.uid });

        if (!user) {
            user = await User.create({
                firebaseUid: decoded.uid,
                name: decoded.name,
                email: decoded.email,
                avatar: decoded.picture
            });
        } else if (decoded.picture && user.avatar !== decoded.picture) {
            user.avatar = decoded.picture;
            await user.save();
        }

        if (normalizeCreditsToPlan(user)) {
            await user.save();
        }

        const sessionId = crypto.randomUUID();
        const sessionData = {
            userId: user._id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt
        };
        const sessionTtl = 7 * 24 * 60 * 60;

        await redis.set(`session-${sessionId}`, JSON.stringify(sessionData), "EX", sessionTtl);
        await redis.set(`user-session-${user._id}`,
            sessionId
        ,"EX",7*24*60*60)

return res.status(200).json({ user, sessionId });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ message: `login error ${err.message}` });
    }
};

export const logout = async(req, res)=>{
    try {
        const sessionId = req.cookies?.session
        await redis.del(`session-${sessionId}`)
        res.clearCookie("session")
        return res.status(200).json({message:"logout successfully"})
    } catch (err) {
        return res.status(500).json({ message: `logout error ${err.message}` });
    }
}

export const updateUserPayment= async(req,res)=>{
    try {
        const { plan, userId } = req.body;
        const planCredits = PLANS[plan]?.credits;
        if (typeof planCredits !== "number") {
            return res.status(400).json({message:"Invalid plan"});
        }

        const user=await User.findById(userId)
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        user.plan=plan
        user.credits=planCredits
        user.totalCredits=planCredits
        user.planExpiresAt= new Date(Date.now() + 30*24*60*60*1000)
        await user.save()

        await updateUserSession(user)
         


    return res.status(200).json({success:true})

    } catch (error) {
        return res.status(500).json({message:`update user payment error ${error}`})
    }
}

export const deductCredits=async (req,res)=>{
    try {
        const {userId,agent}=req.body
        const COST = {
            chat: 1,
            search: 5,
            coding: 10,
            pdf: 10,
            ppt: 10,
            vision: 10,
        };

        const user = await User.findById(userId)

        if(!user){
           return res.status(404).json({message:"user not found"})
        }

        const creditsNormalized = normalizeCreditsToPlan(user);
        const  requiredCredits=COST[agent] || 1
        if(user.credits<requiredCredits){
             if (creditsNormalized) {
                await user.save();
                await updateUserSession(user);
             }
             return res.status(402).json({message:"Not enough credits."})
        }
        user.credits-= requiredCredits
        await user.save()

        await updateUserSession(user)
         


    return res.status(200).json({success:true, credits:user.credits})
    } catch (error) {
         return res.status(500).json({message:`update user payment error ${error}`})
    }
}