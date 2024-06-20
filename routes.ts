import express, { Express, Request, Response, NextFunction } from 'express';
import { client } from './data/DB';
import userUpdate from './routes/userUpdate'
import authentication from './routes/authentication';
import userOTP from './routes/userOTP';
import products from './routes/products';
import userDetails from './routes/userDetails'
const router = express.Router();
// router.get('/users', async (req:Request, res:Response) => {
//     try {
//         const result = await client.query('SELECT * FROM Users');
//         res.json(result.rows);
//     } catch (error) {
//         console.error(error);
//         res.status(500).send('Server Error');
//     }
// });

// Route to fetch a single user by ID
router.get('/product/:id', async (req:Request, res:Response) => {
    const { id } = req.params;
    try {
        const result = await client.query('SELECT * FROM products WHERE productID = $1', [id]);
        if (result.rows.length === 0) {
        return res.status(404).send('Product not found');
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});
router.use('/', authentication);
router.use('/update', userUpdate);
router.use('/',userOTP);
router.use('/',products);
router.use('/',userDetails);
export default router;