import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import jwt from 'jsonwebtoken';
import authenticateToken from '../middleware/header_auth';
const router = express.Router();
const JWT_SECRET = process.env.JWT_ENCRYPTION_KEY as string;
const IDGenerator = ()=>{
    const ID = Math.round(Math.random() * 1000 * 1000 * 100);
    return ID;
}
interface JwtPayload {
    userID: number;
    iat: number;
    exp: number;
}
const fetchAddresses = async (userID: number) => {
    const query = `
        SELECT addressID, userID, addressType, userName, contactNumber, addressLine1, addressLine2, city, state, country, postalCode
        FROM Addresses
        WHERE userID = $1;
    `;
    const values = [userID];
    const result = await client.query(query, values);
    return result.rows;
};

const fetchCartItems = async (userID: number) => {
    const query = `
        SELECT cartitems.productid, cartitems.quantity, products.title, products.discount, cartitems.cartitemid, 
               productimages.imglink, productimages.imgalt, productcolors.colorclass, productcolors.colorname, 
               productcolors.colorid, productsizes.sizeid, productsizes.sizename, productsizes.instock 
        FROM cartitems 
        INNER JOIN products ON cartitems.productid = products.productid 
        INNER JOIN productimages ON cartitems.productid = productimages.productid 
        INNER JOIN productcolors ON cartitems.productid = productcolors.productid 
        INNER JOIN productsizes ON cartitems.productid = productsizes.productid 
        WHERE productimages.isprimary = true AND cartitems.userid = $1;
    `;
    const values = [userID];
    const result = await client.query(query, values);
    return result.rows;
};

const fetchWishlistItems = async (userID: number) => {
    const query = `
        SELECT wishlistitems.productid, products.title, products.discount, wishlistitems.wishlistitemid, 
               productimages.imglink, productimages.imgalt 
        FROM wishlistitems 
        INNER JOIN products ON wishlistitems.productid = products.productid 
        INNER JOIN productimages ON products.productid = productimages.productid 
        WHERE productimages.isprimary = true AND wishlistitems.userid = $1;
    `;
    const values = [userID];
    const result = await client.query(query, values);
    return result.rows;
};
router.post('/user/addresses',authenticateToken, async (req: Request, res: Response) => {
    const { userID } = req.body;
    try {
        // Query to fetch addresses by userID, excluding createdAt and updatedAt
          
        const query = `
            SELECT addressID, addressType, contactNumber, addressLine1, addressLine2, city, state, country, postalCode, userName
            FROM Addresses
            WHERE userID = $1;
        `;
        const values = [userID];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No addresses found for this user' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching addresses:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/user/cart-items',authenticateToken, async (req: Request, res: Response) => {
    const { userID } = req.body;
    try {
        // Query to fetch cart items by userID, including size and color
        const query = `
            SELECT cartitems.productid,cartitems.quantity,products.title,products.discount,cartitems.cartitemid,productimages.imglink,productimages.imgalt,productcolors.colorclass,productcolors.colorname,productcolors.colorid,productsizes.sizeid,productsizes.sizename,productsizes.instock FROM cartitems INNER JOIN products ON cartitems.productid = products.productid INNER JOIN productimages ON cartitems.productid = productimages.productid INNER JOIN productcolors ON cartitems.productid = productcolors.productid INNER JOIN productsizes ON cartitems.productid = productsizes.productid WHERE productimages.isprimary = true AND cartitems.userid = $1;
        `;
        const values = [userID];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No cart items found for this user' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/user/wishlist-items',authenticateToken, async (req: Request, res: Response) => {
    const { userID } = req.body;
    try {
        
        const query = `
            SELECT wishlistitems.wishlistitemid,wishlistitems.productid,products.discount,productimages.imglink,productimages.imgalt,products.title FROM wishlistitems INNER JOIN products ON wishlistitems.productid = products.productid INNER JOIN productimages ON products.productid = productimages.productid WHERE productimages.isprimary = true AND wishlistitems.userid = $1;
        `;
        const values = [userID];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No wishlist items found for this user' });
        }
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/user/all-data', authenticateToken, async (req: Request, res: Response) => {
    const { userIDToken } = req.body;
    const userID = jwt.verify(userIDToken,JWT_SECRET) as JwtPayload;
    try {
        const [addresses, cartItems, wishlistItems] = await Promise.all([
            fetchAddresses(userID.userID),
            fetchCartItems(userID.userID),
            fetchWishlistItems(userID.userID)
        ]);
        
        res.status(200).json({
            addresses,
            cartItems,
            wishlistItems
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
router.post('/user/insert/wishlist-item',authenticateToken,async(req:Request,res:Response)=>{
    const {userID,productID} = req.body;
    const wishlistItemID = IDGenerator();
    const query = `INSERT INTO wishlistitems(wishlistitemid,userid,productid) VALUES($1,$2,$3)`
    const values = [wishlistItemID,userID,productID];
    try {
        await client.query(query,values);
        res.status(200).json({message:'WishlistItem added Successfully'})
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'})
    }
});
router.post('/user/insert/cart-item',authenticateToken,async(req:Request,res:Response)=>{
    const {userID,productID,quantity,sizeID,colorID} = req.body;
    const cartItemID = IDGenerator();
    const query = `INSERT INTO cartitems(cartitemid,userid,productid,quantity,sizeid,colorid) VALUES($1,$2,$3,$4,$5,$6)`
    const values = [cartItemID,userID,productID,quantity,sizeID,colorID];
    try {
        await client.query(query,values);
        res.status(200).json({message:'CartItem added Successfully'})
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'})
    }
});
router.post('/user/insert/address',authenticateToken,async(req:Request,res:Response)=>{
    const {userID,addressType,userName,contactNumber,addressLine1,addressLine2,city,state,country,postalCode} = req.body;
    const addressID = IDGenerator();
    const query = `INSERT INTO addresses(addressid,userid,addresstype,username,contactnumber,addressline1,addressline2,city,state,country,postalcode) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`
    const values = [addressID,userID,addressType,userName,contactNumber,addressLine1,addressLine2,city,state,country,postalCode];
    try {
        await client.query(query,values);
        res.status(200).json({message:'Address added Successfully'})
    } catch (error) {
        res.status(500).json({message:'Internal Server Error'})
    }
});
export default router;