import express, { Request, Response } from 'express';
import { client } from '../data/DB';
import authenticateToken from '../middleware/header_auth';
const router = express.Router();
const IDGenerator = ()=>{
    const ID = Math.round(Math.random() * 1000 * 1000 * 100);
    return ID;
}
router.post('/product/create',authenticateToken,async (req:Request,res:Response)=>{
    const {title,description,price,discount,stock,tags,imgLink,imgAlt,isSale,isNew,isDiscount,categoryID} = req.body;
    const productQuery = `INSERT INTO products (productid, title, description, categoryid, price, discount, stock, tags, imgid) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
    const productImagesQuery = `INSERT INTO productimages (imageid, productid, imglink, imgalt, isprimary) VALUES ($1, $2, $3, $4, $5)`;
    const productParamsQuery = `INSERT INTO productparams (productid, issale, isnew, isdiscount) VALUES ($1, $2, $3, $4)`;
    const productID = IDGenerator();
    const imageID = IDGenerator();
    try {
        await client.query(productQuery,[productID,title,description,categoryID,price,discount,stock,tags,imageID]);
        await client.query(productImagesQuery,[imageID,productID,imgLink,imgAlt,true]);
        await client.query(productParamsQuery,[productID,isSale,isNew,isDiscount]);
        return res.status(200).json({message:'Product Added Successfully'});
    } catch (error) {
        return res.status(500).json({message:'Internal Server Error'});
    }
});
router.post('/product/create/image',authenticateToken,async (req:Request,res:Response)=>{
    const {productID,imgLink,imgAlt} = req.body;
    const imageID = IDGenerator();
    const productImagesQuery = `INSERT INTO productimages (imageid, productid, imglink, imgalt, isprimary) VALUES ($1, $2, $3, $4, $5)`;
    try {
        await client.query(productImagesQuery,[imageID,productID,imgLink,imgAlt,false]);
        return res.status(200).json({message:'Image Added Successfully'});
    } catch (error) {
        return res.status(500).json({message:'Internal Server Error'});
    }
});
router.post('/product/create/size',authenticateToken,async (req:Request,res:Response)=>{
    const {productID,sizeName,inStock} = req.body;
    const sizeID = IDGenerator();
    const productSizesQuery = `INSERT INTO productparams (sizeid,productid,sizename,instock) VALUES ($1, $2, $3, $4)`;
    try {
        await client.query(productSizesQuery,[sizeID,productID,sizeName,inStock]);
        return res.status(200).json({message:'Size Added Successfully'});
    } catch (error) {
        return res.status(500).json({message:'Internal Server Error'});
    }
});
router.post('/product/create/color',authenticateToken,async (req:Request,res:Response)=>{
    const {productID,colorName,colorClass} = req.body;
    const colorID = IDGenerator();
    const productColorsQuery = `INSERT INTO productcolors (colorid, productid, colorname, colorclass) VALUES ($1, $2, $3, $4)`;
    try {
        await client.query(productColorsQuery,[colorID,productID,colorName,colorClass]);
        return res.status(200).json({message:'Color Added Successfully'});
    } catch (error) {
        return res.status(500).json({message:'Internal Server Error'});
    }
});
export default router;