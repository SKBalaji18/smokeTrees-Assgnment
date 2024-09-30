const express = require('express')
// const { v4: uuidv4 } = require('uuid');

const app = express()

const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const path = require('path');


app.use(express.json());

const dbPath = path.join(__dirname, 'UserData.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    await db.run(`
      CREATE TABLE IF NOT EXISTS User (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      );
    `);
  
    // Create Address table
    await db.run(`
      CREATE TABLE IF NOT EXISTS Address (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        address TEXT,
        FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
      );
    `);

    app.listen(3000, () => {
      console.log('Server Started at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

app.post('/register',async(request,response)=>{
  const {name,address} = request.body

  if(!name || !address){
    return response.status(400).json({message:"Enter Required"})
  }

  try{

    const userInsertQuery = `
        INSERT INTO User (name)
        VALUES (?);
      `;
    const result = await db.run(userInsertQuery,[name]);

      // Get the newly created user's ID
    const userId = result.lastID;
  
    const addressInsertQuery = `
      INSERT INTO Address (user_id, address)
      VALUES (?, ?);
    `;
    
    await db.run(addressInsertQuery,[userId,address]);

    response.status(201).json({message:"Details Stored "})
  }
  catch(e){
    return response.status(500).json({message:e.message})
  }
})


app.get('/users', async(request, response)=>{
    try {
      const getUsersQuery = `SELECT * FROM User`;
      const users = await db.all(getUsersQuery)
  
      if (users.length === 0) {
        return response.status(404).json({message:"'No users found'"});
      }
  
      return response.status(200).json(users);
    } catch (error) {
      console.error('Error fetching user details:', error);
      response.status(500).json({ message: 'Internal server error' });
    }
})

app.get('/addresses', async(request, response)=>{
  try {
    const getAddressQuery = `SELECT * FROM Address`;
    const addresses = await db.all(getAddressQuery)

    if (addresses.length === 0) {
      return response.status(404).json({message:"'No addresses found'"});
    }

    return response.status(200).json(addresses);
  } catch (error) {
    console.error('Error fetching user details:', error);
    response.status(500).json({ message: 'Internal server error' });
  }
})