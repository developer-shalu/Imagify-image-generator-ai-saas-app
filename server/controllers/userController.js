import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Razorpay from "razorpay";
import transactionModel from "../models/transactionModel.js";

const registerUser = async (req, res) => {
    try {
        let { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }
        email = email.toLowerCase();

        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.json({ success: false, message: "Email already registered" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = {
            name,
            email,
            password: hashedPassword
        };
        const newUser = new userModel(userData);
        const user = await newUser.save();
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ success: true, token, user: { name: user.name, email: user.email }, credits: user.creditBalance }
        );
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}


const loginUser = async (req, res) => {
    try {
        let { email, password } = req.body;
        if (!email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }
        email = email.toLowerCase();
        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.json({ success: true, token, user: { name: user.name, email: user.email }, credits: user.creditBalance });
        }
        else {
            return res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const userCredits = async (req, res) => {
    try {
        const userId = req.userId; // from auth middleware
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, credits: user.creditBalance, user: { name: user.name, email: user.email } });
    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

const getRazorpayConfig = () => {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.ROZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.ROZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        throw new Error("Razorpay keys are not configured");
    }

    return { keyId, keySecret };
};

const paymentRazorpay = async (req, res) => {
    try {
        const userId = req.userId;
        const { planId } = req.body;
        const userData = await userModel.findById(userId);
        const { keyId, keySecret } = getRazorpayConfig();
        const razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret
        });

        if (!userData || !planId) {
            return res.json({ success: false, message: "Missing Details" });
        }

        let credits, plan, amount, date

        switch (planId) {
            case 'Basic':
                plan = 'Basic',
                    credits = 100
                amount = 10
                break;
            case 'Advanced':
                plan = 'Advanced',
                    credits = 500
                amount = 50
                break;
            case 'Business':
                plan = 'Business',
                    credits = 5000
                amount = 250
                break;

            default:
                return res.json({ success: false, message: " Plan not found" });
        }

        date = Date.now();

        const transactionData = {
            userId,
            plan,
            amount,
            credits,
            date
        };
        const newTransaction = await transactionModel.create(transactionData);

        const options = {
            amount: amount * 100, // amount in the smallest currency unit
            currency: process.env.CURRENCY || "INR",
            receipt: newTransaction._id.toString(),
        };

        const order = await razorpayInstance.orders.create(options);
        res.json({ success: true, order });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const verifyRazorpay = async (req, res) => {
    try {
        const userId = req.userId;
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            transactionId
        } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !transactionId) {
            return res.json({ success: false, message: "Missing payment verification details" });
        }

        const { keySecret } = getRazorpayConfig();
        const expectedSignature = crypto
            .createHmac("sha256", keySecret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.json({ success: false, message: "Payment verification failed" });
        }

        const transaction = await transactionModel.findOne({ _id: transactionId, userId });
        if (!transaction) {
            return res.json({ success: false, message: "Transaction not found" });
        }

        if (transaction.payment) {
            return res.json({ success: true, message: "Payment already verified" });
        }

        await transactionModel.findByIdAndUpdate(transactionId, { payment: true });
        await userModel.findByIdAndUpdate(userId, { $inc: { creditBalance: transaction.credits } });

        res.json({ success: true, message: "Payment successful", credits: transaction.credits });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { registerUser, loginUser, userCredits, paymentRazorpay, verifyRazorpay };
