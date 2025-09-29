const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require('bcrypt');
require("dotenv").config();
const db = require('./db.js')

app.use(cors({
    origin: 'http://18.215.167.131',
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

function generateCode (){
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
        let code = ""
            for (let i = 0; i<6; i++){
                code+=chars[Math.floor(Math.random()* 36)]
            }
        console.log(code)
        return code   
    }

app.post('/login', async (req,res)=>{
    //authenticate
    const username = req.body.username;
    try{
        const [results] = await db.query("SELECT user_id AS user, password FROM users WHERE user_id = (?)", [username])
        if (results.length < 1){
                console.log("No matching users")
                res.status(401).json({error: "No matches found"});
            }
        else{
            console.log(results)
            try{
                const match = await bcrypt.compare(req.body.password, results[0].password);
                if (match){
                    //jwt
                    const payload = {user_id: username};
                    const access_token = jwt.sign(payload, process.env.ACCESS_TOKEN);
                    console.log(access_token);
                    res.status(200).cookie("accessToken", access_token, 
                        {maxAge: 100000000, httpOnly:true}).json({status: "Success"});
                }
                else {
                    throw new Error ("Not Allowed")
                }
            }
            catch (error){
                console.log('Incorrect Password');
                res.status(401).json({Status: "Error: " + error.message});
            }
        }
    }
    catch (error){
        console.error(error)
        res.json({error: error}).status(500);
    }
})

app.post("/signup", async (req,res)=>{
    const username = req.body.username;
    const hashed =  await bcrypt.hash(req.body.password, 10);
    console.log(hashed);
    try{
        const [results] = await db.query("INSERT INTO users (user_id, password) VALUES (?,?)", [username, hashed]) 
        res.status(200).json({results: results});
    }
    catch (error){
        console.error(error)
        res.status(500).json({error: error.code});

    }
})

app.post("/logout", (req, res)=>{
    res.status(200).clearCookie('accessToken', {httpOnly: true}).json({status: "Logged Out"})
})



app.get('/dashboard', authenticateToken, async (req, res) => {
    const user_id = req.user.user_id;

    try {
        const [results] = await db.query(
            `
            SELECT g.group_id,
                   g.group_name,
                   ug.joined_at,

                   -- count of members in the group
                   (SELECT COUNT(*) 
                    FROM usergroups ug2 
                    WHERE ug2.group_id = g.group_id) AS member_count,

                   -- user’s net balance inside this group
                   (
                    -- amount owed to others
                    SELECT COALESCE(SUM(b.amount),0) 
                    FROM balances b
                    JOIN transactions t2 ON b.transaction_id = t2.transaction_id
                    WHERE t2.group_id = g.group_id
                        AND b.assignee_id = ? 
                        AND b.creator_id != ?

                    )  -- negative because user owes this

                    -
                    (
                    -- amount owed to user
                    SELECT COALESCE(SUM(b.amount),0) 
                    FROM balances b
                    JOIN transactions t2 ON b.transaction_id = t2.transaction_id
                    WHERE t2.group_id = g.group_id
                        AND t2.creator_id = ?
                        AND b.assignee_id != t2.creator_id
                    ) AS user_balance,

                   -- most recent transaction edit in the group
                   (SELECT MAX(t3.date_edited)
                    FROM transactions t3
                    WHERE t3.group_id = g.group_id) AS last_activity

            FROM usergroups ug
            INNER JOIN \`groups\` g ON g.group_id = ug.group_id
            WHERE ug.user_id = ?
            ORDER BY last_activity DESC
            `,
            [user_id, user_id, user_id, user_id]
        );

        res.status(200).json({ results });
        console.log(results);
    } catch (error) {
        console.error(error);
        res.status(500).json({ Status: "SERVER ERROR" });
    }
});



app.post("/groups/create", authenticateToken , async (req, res)=>{
    let codeValid = false
    let groupCode

    while (!codeValid){
        groupCode = generateCode()
        console.log(groupCode)
        const [results] = await db.query("SELECT * FROM `groups` WHERE group_id=(?)", [groupCode])
        if (results.length == 0){
                codeValid = true
            }
    }
    const groupName = req.body.groupName
    const ownerId = req.user.user_id

    if (groupName.trim()=="" || groupName.length > 255){
        res.status(400).json({status:"Invalid Group Name"})
    }
    else{
        const conn = await db.getConnection()

        try{
            await conn.beginTransaction()
            const [groupsResults] = await conn.query("INSERT INTO `groups` (group_id, group_name, owner_id) VALUES (?,?,?)", [groupCode, groupName, ownerId])
            const [userGroupsResults] = await conn.query("INSERT INTO usergroups (group_id, user_id) VALUES (?,?)", [groupCode, ownerId])
            await conn.commit()
            console.log("ADDED GROUP, NAME: ", groupName, " CODE: ", groupCode)
            res.status(200).json({status: "Success", groupCode: groupCode})
        }
        catch (error){
            await conn.rollback()
            console.error("DB INSERT ERROR AT \"/groups/create\": ", error)
            res.status(500).json({status: "DB INSERT ERROR"})
        }
        
        conn.release()
    }   
})

app.post("/groups/join", authenticateToken, async (req, res)=>{
    const groupCode = req.body.groupCode
    const user_id=req.user.user_id
    const conn = await db.getConnection()

    try {
        await conn.beginTransaction()

        const [groupsResults] = await conn.query ("SELECT * FROM `groups` WHERE group_id=(?)", [groupCode])
        if (groupsResults.length != 1){
            console.log("Incorrect group join code")
            return res.status(404).json({status: "Incorrect group join code"})
        }

        const [userGroupsResults] = await conn.query("SELECT * FROM usergroups WHERE group_id=(?) AND user_id=(?)", [groupCode, user_id])
        if (userGroupsResults.length > 0){
            console.log("Already a member of this group")
            return res.status(409).json({status: "Already a member of this group"})
        }

        await conn.query("INSERT INTO usergroups (user_id, group_id) VALUES (?,?)", [user_id, groupCode])
        conn.commit()
        return res.status(200).json({status: "success"})
    } catch (error) {
        res.status(500).json({status: error.message})
        conn.rollback()
    }
    finally{
        conn.release()
    }
})

app.get("/groups/details", authenticateToken, async (req,res)=>{
    user_id = req.user.user_id
    group_id = req.query.group_id

    try{
            const [othersTransactionsResults] = await db.query("SELECT transactions.*, balances.amount AS balance_amount, balances.assignee_id FROM transactions "+
            "INNER JOIN balances ON (transactions.transaction_id=balances.transaction_id) WHERE transactions.group_id=(?) AND balances.assignee_id=(?) AND transactions.creator_id!=(?)", 
            [group_id, user_id, user_id])
        
            const [selfTransactionsResults] = await db.query("SELECT transactions.*, balances.amount AS balance_amount, balances.assignee_id FROM transactions INNER "+ 
            "JOIN balances ON transactions.transaction_id=balances.transaction_id WHERE transactions.creator_id=(?) AND transactions.group_id=(?)", 
            [user_id, group_id])
        
            const [groupResults] = await db.query("SELECT * FROM `groups` WHERE group_id=(?)",[group_id])

            const [userGroupsResults] = await db.query("SELECT * FROM usergroups WHERE user_id = (?) AND group_id = (?)", [user_id, group_id])

            if (userGroupsResults.length != 1){
                throw new Error("User not allowed to see group details");
            }

            const [groupMembers] = await db.query("SELECT user_id AS user FROM usergroups WHERE group_id = (?)", [group_id])
            
            if (groupMembers.length < 1){
                throw new Error("Something Went Wrong") //may as well have this, just in case
            }

        //process the selfTransactionResults
        let processedSelfTransactionResults = {}

        for (const row of selfTransactionsResults){
            if (!processedSelfTransactionResults[row.transaction_id]){
                processedSelfTransactionResults[row.transaction_id] = {
                    transaction_id: row.transaction_id,
                    creator_id: row.creator_id,
                    total_amount: row.amount,
                    date_edited: row.date_edited,
                    description: row.transaction_description,
                    name: row.transaction_name,
                    balances:  []
                }
            }
            processedSelfTransactionResults[row.transaction_id].balances.push({assignee_id: row.assignee_id, balance_amount: row.balance_amount})
        }
        processedSelfTransactionResults = Object.values(processedSelfTransactionResults)
        
        res.status(200).json({transactions_others: othersTransactionsResults, transactions_self: processedSelfTransactionResults, 
            groupResults: groupResults, groupMembers, status: "success"})
    }
    catch(error){
        console.log(error.message)
        res.status(400).json({status: error.message})
    }
})
 

app.get("/groups/details/verify", authenticateToken, async (req, res)=>{
    user_id = req.user.user_id
    group_id = req.query.group_id
    console.log(group_id)
    
    try {
        const [userGroupsResults] = await db.query("SELECT * FROM usergroups WHERE user_id = (?) AND group_id = (?)", [user_id, group_id])

        if (userGroupsResults.length != 1){
            throw new Error("User not allowed to see group details");
        }

        const [groupMembers] = await db.query("SELECT user_id AS user FROM usergroups WHERE group_id = (?)", [group_id])
        
        if (groupMembers.length < 1){
            throw new Error("Something Went Wrong") //may as well have this, just in case
        }
        return res.status(200).json({status: "success", groupMembers: groupMembers})

    } catch (error) {
        return res.status(400).json({status: error.message })
    }
})


app.patch("/groups/details/transactions/pay", authenticateToken, async (req, res)=>{
    const user_id = req.user.user_id
    const transaction_id = req.body.transaction_id
    const pay_amount = req.body.pay_amount

    const conn = await db.getConnection()
    await conn.beginTransaction()
    
    try{
        const [results] = await conn.query("UPDATE balances SET amount=amount-(?) WHERE transaction_id=(?) AND assignee_id=(?)", [pay_amount, transaction_id, user_id])
        const [updatedResults] = await conn.query("SELECT * FROM balances WHERE transaction_id=(?) AND assignee_id=(?)", [transaction_id, user_id])
        const [updateTransactionsDate] = await conn.query("UPDATE transactions set date_edited=CURRENT_TIMESTAMP WHERE transaction_id=(?)", [transaction_id])
        console.log(updatedResults)
        await conn.commit()
        res.status(200).json({status: "success", success: true, results: updatedResults})
    }
    catch(error){
        await conn.rollback()
        console.log(error.message)
        res.status(400).json({status: error.message, success: false})
    }
    finally{
        conn.release()
    }
})

app.delete("/groups/details/transactions/delete", authenticateToken, async (req, res)=>{
    user_id = req.user.user_id
    transaction_id = req.body.transaction_id
    try{
        //verify if user in group and made transactoin
        //delete transaction from transactions table and cascade for balances
        // Verify transaction exists and belongs to this user
        const [transaction] = await db.query(
            "SELECT * FROM transactions WHERE transaction_id = ? AND creator_id = ?",
            [transaction_id, user_id]
        );

        if (transaction.length === 0) {
            return res.status(403).json({ status: "Unauthorized or transaction not found", success: false });
        }

        // Delete the transaction (balances will be removed via ON DELETE CASCADE if foreign keys are set up correctly)
        await db.query("DELETE FROM transactions WHERE transaction_id = ?", [transaction_id]);
        res.status(200).json({ status: "Transaction deleted successfully", success: true });
    }
    catch (error){
        res.status(400).json({status: error.message, success: false})
    }
})

app.post("/groups/details/transactions", authenticateToken, async (req, res)=>{
    const conn = await db.getConnection()
    
    try{
        await conn.beginTransaction()

        const user_id = req.user.user_id
        const transaction_info = req.body.fields
        const user_amounts = req.body.userAmounts
        console.log(req.body)
        

        let amount_sum = 0
        for (const username in user_amounts){
            amount_sum+= user_amounts[username][1]
        }

        let difference = transaction_info.amount - amount_sum
        const firstUser = Object.keys(user_amounts)[0]
        user_amounts[firstUser][1] = (Number(user_amounts[firstUser][1]) + difference).toFixed(2)

        //generate transaction id
        let codeValid = false
        let transaction_id
        while (!codeValid){
            transaction_id = generateCode()
            const [results] = await conn.query("SELECT * FROM `transactions` WHERE transaction_id=(?)", [transaction_id])
            if (results.length == 0){
                codeValid = true
            }
        }
        const [insertTransactionResults] = await conn.query("INSERT INTO transactions (transaction_name, transaction_id, creator_id, amount, transaction_description, group_id, transaction_date) " +
            "VALUES (?,?,?,?,?,?,?)",
            [transaction_info.name, transaction_id, user_id, transaction_info.amount, transaction_info.description, transaction_info.group_id, transaction_info.date])

        
        //check if users in group
        const [results] = await conn.query("SELECT * FROM usergroups WHERE user_id=(?) AND group_id=(?)", [user_id, transaction_info.group_id])

        if (results.length != 1){
                throw new Error("error: User not authorized to make transactions with this group. Try again.")
            }

        for (const [username, amounts] of Object.entries(user_amounts)){
        
            let [results] = await conn.query("SELECT * FROM usergroups WHERE user_id=(?) AND group_id=(?)", [username, transaction_info.group_id])

            if (results.length != 1){
                throw new Error("error: User not authorized to make transactions with this group. Try again.")
            }

            //add balances all balances; even for transactions that the person themselves created and paid for to keep track. 
            // do not include these amounts when calculating amount owed/paid since you cannot owe yourself money
            const [insertBalanceResults] = await conn.query("INSERT INTO balances (transaction_id, creator_id, assignee_id, amount) VALUES (?,?,?,?)", [transaction_id, user_id, username, amounts[1]])
        }

        await conn.commit()
        res.status(200).json({status: "success", success: true})
    }
    catch (error){
        console.log(error)
        conn.rollback()
        return res.status(400).json({status: error.message, succes: false})
    }
    finally{
        conn.release()
    }
})

app.patch("/groups/details/transactions/edit", authenticateToken, async (req, res) => {
    const conn = await db.getConnection();

    try {
        await conn.beginTransaction();

        const user_id = req.user.user_id;
        const { fields, userAmounts, transaction_id } = req.body;

        if (!transaction_id) {
            throw new Error("transaction_id is required for editing");
        }

        // Verify the transaction exists and belongs to this user
        const [transactionCheck] = await conn.query(
            "SELECT * FROM transactions WHERE transaction_id = ? AND creator_id = ?",
            [transaction_id, user_id]
        );

        if (transactionCheck.length === 0) {
            throw new Error("Transaction not found or user not authorized");
        }

        // Update transaction main info
        await conn.query(
            "UPDATE transactions SET transaction_name = ?, amount = ?, transaction_description = ?, transaction_date = ? WHERE transaction_id = ?",
            [fields.name, fields.amount, fields.description, fields.date, transaction_id]
        );

        // Update balances
        for (const [username, amounts] of Object.entries(userAmounts)) {
            // Verify user is in the group
            const [userCheck] = await conn.query(
                "SELECT * FROM usergroups WHERE user_id = ? AND group_id = ?",
                [username, fields.group_id]
            );

            if (userCheck.length !== 1) {
                throw new Error(`User ${username} is not in the group`);
            }

            // Update balance
            await conn.query(
                "UPDATE balances SET amount = ? WHERE transaction_id = ? AND assignee_id = ?",
                [amounts[1], transaction_id, username]
            );
        }

        await conn.commit();
        console.log("good")
        res.status(200).json({ status: "success", success: true });
    } catch (error) {
        await conn.rollback();
        console.error("Edit transaction error:", error.message);
        res.status(400).json({ status: error.message, success: false });
    } finally {
        conn.release();
    }
});

function authenticateToken (req,res,next){
    try{
        const accessToken = req.cookies.accessToken;
        if (!accessToken){
            throw new Error("JWT does not exist")
        }
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN);
        req.user = decoded;
        next();
    }
    catch (err){
        console.error('JWT verification failed:', err.message);
        return res.status(401).json({status: "Not Authorized"});
}}

app.get("/", (req,res)=>{
    res.status(200).json({message: "THIS WORKS"})
})

app.get("/protected", authenticateToken, (req,res)=>{
    res.status(200).json({status: "success", user: req.user});
})

app.listen(process.env.PORT || 3000, ()=> console.log("listening on port " + process.env.PORT));