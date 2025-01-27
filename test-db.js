const pool = require("./db/db.js")

const PG_TEST = async () => {
  try {
    // Test the connection
    const client = await pool.connect()
    console.log("Connected to the database successfully!")

    // Run a simple query to verify everything is working
    const result = await client.query("SELECT NOW()")
    const questionType = await client.query("SELECT * FROM question_type")
    console.log("Question Type:", questionType.rows)

    // Release the client back to the pool
    client.release()
  } catch (error) {
    console.error("Error connecting to the database:", error)
  } finally {
    // Close the pool to ensure the script exits cleanly
    await pool.end()
  }
}

PG_TEST()
