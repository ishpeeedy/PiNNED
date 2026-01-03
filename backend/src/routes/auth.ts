import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const user = new User({ email, password, name });
        await user.save();
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );
        res.status(201).json({
            message: 'User created successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'fallback-secret-key',
            { expiresIn: '7d' }
        );
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
            },
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get(
    '/me',
    authenticateToken,
    async (req: AuthRequest, res: Response) => {
        try {
            const user = await User.findById(req.user?.userId).select(
                '-password'
            );
            if (!user) {
                res.status(404).json({ message: 'User not found' });
                return;
            }
            res.json({
                user: { id: user._id, email: user.email, name: user.name },
            });
        } catch (error) {
            res.status(500).json({ message: 'Server error' });
        }
    }
);

export default router;
