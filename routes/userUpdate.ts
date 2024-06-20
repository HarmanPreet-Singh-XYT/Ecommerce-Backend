import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import bcrypt from 'bcrypt';
import authenticateToken from '../middleware/header_auth'; // Adjust the path as needed

const saltRounds = 10;
const router = express.Router();
const userTable = 'users';


// Update user route
router.put('/user', authenticateToken, async (req: Request, res: Response) => {
    const { userName, email, password, mobile_number, dob } = req.body;
    const userID = req.body.userID; // Assuming `req.user` contains the authenticated user info
    const updatedIP = req.ip; // Capture the IP address from the request

    try {
        // Validate input (optional)
        const updates = [];
        const values = [];
        let valueIndex = 1;

        if (userName) {
            updates.push(`userName = $${valueIndex++}`);
            values.push(userName);
        }
        if (email) {
            updates.push(`email = $${valueIndex++}`);
            values.push(email);
        }
        if (password) {
            const hash = await bcrypt.hash(password, saltRounds);
            updates.push(`password = $${valueIndex++}`);
            values.push(hash);
        }
        if (mobile_number) {
            updates.push(`mobile_number = $${valueIndex++}`);
            values.push(mobile_number);
        }
        if (dob) {
            updates.push(`dob = $${valueIndex++}`);
            values.push(dob);
        }

        // Always update the updated_ip field
        updates.push(`update_ip = $${valueIndex++}`);
        values.push(updatedIP);

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        values.push(userID);
        const updateQuery = `UPDATE "${userTable}" SET ${updates.join(', ')} WHERE userID = $${valueIndex}`;

        await client.query(updateQuery, values);

        res.status(200).json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
