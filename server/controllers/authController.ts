import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import { AuthRequest } from "../middlewares/auth.js";


// Helper to generate JWT token
const generateToken = (userId: string) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, { expiresIn: '30d' })
};

// Post /api/auth/register
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password, phone, role } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ error: "Please provide all required fields" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: "User already exists" });
        }

        // Hash password and create user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            phone,
            role,
        });

        if (newUser) {
            const token = generateToken(newUser._id.toString());
            res.status(201).json({
                _id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                phone: newUser.phone,
                role: newUser.role,
                token
            }); 
        } else {
            res.status(400).json({ error: "Invalid user data" });
        }
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};


// Post /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Please provide email and password" });
        }

        // Check if user exists
        const userExists = await User.findOne({ email });
        if (!userExists) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, userExists.password!);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid credentials" });
        }

        const token = generateToken(userExists._id.toString());
        res.status(200).json({
            _id: userExists._id,
            username: userExists.username,
            email: userExists.email,
            phone: userExists.phone,
            role: userExists.role,
            token
        });
        
    } catch (error: any) {
        console.error(error)
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};

// Post /api/auth/me
// @access Private
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        if(!req.user) {
            res.status(401).json({ error: "Not authorized, user not found" });
            return;
        }
        res.json(req.user)
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ error: error.message || "Internal Server Error" });
    }
};