import userModel from "../models/userModel.js";
import FormData from "form-data";
import axios from "axios";

export const generateImage = async (req, res) => {
    try {
        const { prompt } = req.body;
        const userId = req.userId; // from auth middleware

        if (!prompt || !prompt.trim()) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        // Fix credit balance check
        if (user.creditBalance <= 0) {
            return res.json({ success: false, message: "No Credit Balance", creditBalance: user.creditBalance });
        }

        if (!process.env.CLIPDROP_API) {
            return res.json({ success: false, message: "ClipDrop API key is missing" });
        }

        const formData = new FormData();
        formData.append('prompt', prompt.trim());
        // Include proper multipart headers along with API key
        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', formData, {
            headers: {
                ...formData.getHeaders(),
                'x-api-key': process.env.CLIPDROP_API,
            },
            responseType: 'arraybuffer',
        })
        const base64Image = Buffer.from(data, 'binary').toString('base64');
        const resultImage = `data:image/png;base64,${base64Image}`;

        // Decrement credits safely after successful generation
        const updatedUser = await userModel.findOneAndUpdate(
            { _id: user._id, creditBalance: { $gt: 0 } },
            { $inc: { creditBalance: -1 } },
            { new: true }
        );
        if (!updatedUser) {
            return res.json({ success: false, message: "No Credit Balance", creditBalance: user.creditBalance });
        }

        res.json({ success: true, message: "Image Generated Successfully", creditBalance: updatedUser.creditBalance,  resultImage });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}