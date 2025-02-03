export default async function UpdateBubble(
  user_id,
  /*is_correct,*/ poll_title,
  snowflake
) {
  try {
    const response = await fetch(
      "https://thenotwork.org/version-test/api/1.1/obj/DISCORD_POLL_RESPONSES",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BUBBLE_API_KEY}`,
        },
        body: JSON.stringify({
          user_id: user_id,
          poll_title: poll_title,
          // is_correct: is_correct,
          snowflake: snowflake,
        }),
      }
    )
    const responseData = await response.json()

    if (!response.ok) {
      console.error("Bubble API Error:", response.status, responseData)
    } else {
      console.log("Successfully posted to Bubble:", responseData)
    }
  } catch (error) {
    console.error("Fetch error:", error)
  }
}
