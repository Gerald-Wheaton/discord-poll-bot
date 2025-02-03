/*

{
  type: "clickable" || "input",
  image?: "string",
  questions: [
    // if clickable
    {
      type: "buttons" || "multiple_choice",
      question: "string",
      options: "string[]",
    },

    // if input
    {
      type: "long_answer" || "short_answer",
      question: "string",
    },
  ],
}

*/

// const TEST_QUIZ = {
//   type: "clickable",
//   image: "https://example.com/image1.png",
//   questions: [
//     {
//       question: "What is your favorite color?",
//       options: ["Red", "Blue", "Green", "Yellow"],
//     },
//     {
//       question: "Pick your preferred mode of transportation.",
//       options: ["Car", "Bicycle", "Bus", "Walking"],
//     },
//   ],
// }

// const TEST_QUIZ = {
//   type: "clickable",
//   title: "Programming Quiz",
//   questions: [
//     {
//       type: "multiple_choice",
//       question: "Which programming languages do you know?",
//       options: ["JavaScript", "Python", "C++", "Java"],
//     },
//     {
//       type: "multiple_choice",
//       question: "Which social media platforms do you use?",
//       options: ["Twitter", "Instagram", "Facebook", "TikTok"],
//     },
//   ],
// }

const quiz = {
  type: "input",
  title: "Science Quiz",
  questions: [
    {
      type: "long_answer",
      question: "Explain how gravity works in your own words.",
    },
    {
      type: "short_answer",
      question: "What is the capital of France?",
    },
  ],
}

export { quiz }
