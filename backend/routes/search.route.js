import express from 'express';
import User from '../models/user.model.js'; // Adjust the path to your User model

const router = express.Router();

router.get('/search', async (req, res) => {
    try {
        const { query } = req.query; // Get the search query from the URL
        if (!query) {
            return res.status(400).json({ message: "Search query is required" });
        }

        // Search for users where the 'name' or 'username' fields match the query
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select('name username profileImg'); // Select only the necessary fields

        res.status(200).json(users);
    } catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;


// import express from "express";
// import User from "../models/user.model.js"; // your User model

// const router = express.Router();

// // GET /api/search?query=someText
// router.get("/", async (req, res) => {
//     try {
//         let { query } = req.query;

//         if (!query) {
//             return res.status(400).json({ message: "Query is required" });
//         }

//         query = query.trim(); // remove extra spaces

//         // Case-insensitive, partial match using regex
//         const regex = new RegExp(query, "i");

//         const users = await User.find({
//             $or: [
//                 { name: regex },       // matches name partially, case-insensitive
//                 { username: regex }    // matches username partially, case-insensitive
//             ],
//         })
//             .limit(10)               // limit results
//             .select("name username"); // only return necessary fields

//         console.log("Search query:", query);
//         console.log("Found users:", users);

//         res.json(users);
//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });

// export default router;
