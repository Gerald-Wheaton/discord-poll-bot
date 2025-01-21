const pool = require("./db")

const insertQuestion = async (question, type) => {
  try {
    await pool.query("INSERT INTO question (QUESTION, TYPE) VALUES ($1, $2)", [
      question,
      type,
    ])
    console.log("Question inserted successfully")
  } catch (err) {
    console.error("Error inserting question:", err.message)
  }
}

const insertAnswer = async (questionId, answer, username) => {
  try {
    await pool.query(
      "INSERT INTO answer (QUESTION_ID, ANSWER, USERNAME) VALUES ($1, $2, $3)",
      [questionId, answer, username]
    )
    console.log("Answer inserted successfully")
  } catch (err) {
    console.error("Error inserting answer:", err.message)
  }
}

module.exports = {
  insertQuestion,
  insertAnswer,
}
