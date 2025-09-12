const { replySuccess, replyError } = require("../../core/core_funcs");
const { demoservice } = require("../services/ai-services");

async function DEMO(request, reply) {
    try {
        const body = request.body;
        const { device_info } = request.body

        return replySuccess(reply, { message: "api is working fine" })
    } catch (err) {
        return replyError(reply, err)
    }
}

async function GET_QUESTION(request, reply) {
    try {
        const role = request.body.role || "backend developer";
        const level = request.body.difficulty || "medium";
        const topic = request.body.topic || "";
        const userId = request.user_info.id
        const have_jd = request.body.have_jd || false;
        const job_description = request.body.jobDescription || "";
        const company = request.body.company || "";
        const count = 2;

        const prompt = `
            Ask ONE clear and direct interview question.  
            
            ${have_jd 
            ? `Base the question strictly on the following job description (JD):\n${job_description}\n`
            : `Base the question on the given context:\n${topic ? `- Topic: ${topic}\n` : ""}- Role: ${role}\n- Level: ${level}\n`
            }

            ${topic && topic.toLowerCase() === "coding" 
            ? "The question must be a coding challenge(with code snippet). Format the response in Markdown with sections like **Problem Statement**, **Input Format**, **Output Format**, and include at least one example inside a fenced code block (```)." 
            : "Format the question in Markdown (e.g., start with a heading ###, bold important keywords if needed)."
            }

            Make sure the question is relevant, concise, and grammatically correct.  
            Return only the question, nothing else.
        `;




        const response = await this.AiModel.generateContent(prompt);
        const questionText = response.response.text().trim();

        const sampleQuestion = {
            question: questionText,
            difficulty: 1,
            user_id: userId,
            company: company
        };

        const questionResponse = await this.knex
          .insert(sampleQuestion)
          .into("questions")
          .returning("id");

        //  res.json({
        //      question: questionText,
        //     //  qns_id: questionResponse[0].id
        //  });
        replySuccess(reply, { question: questionText, qns_id: questionResponse[0].id })
    } catch (err) {
        console.error("Error generating question:", err);
        replyError(reply, err)
    }
}

async function GET_FEEDBACK(request, reply) {
    try {
        const { answer = '', role = "backend developer", question = "what is the use of ai", qns_id = 0 } = request.body;

        const prompt = `You are an expert interviewer and communication coach. 
                Evaluate the candidate’s answer for a ${role} role.

                Question: "${question}" 
                Answer: "${answer}" 

                Your feedback must be returned strictly as a JSON object with the following keys:
                {
                "score": "number from 1 to 10",
                "strengths": "list of strengths in the answer in single line separated by commas",
                "improvements": "areas where the candidate can improve in single line separated by commas",
                "missed_points": "important points or concepts they missed or could add in single line separated by commas",
                "sarcastic_feedback": "A witty, slightly sarcastic comment that points out flaws in a light-hearted way",
                "positive_feedback": "short, encouraging summary (2–3 sentences, voice-friendly)",
                "final_feedback": "short, encouraging summary (2–3 sentences, voice-friendly)",
                "actual_answer" : "detailed explanation to help the candidate to prepare"
                }

                Rules:
                - Do not include anything outside the JSON object.
                - Be constructive, encouraging, and clear since this will be read out loud through voice.`;

        const response = await this.AiModel.generateContent(prompt);
        const feedbackText = response.response.text();

        let cleaned = feedbackText.trim();
        cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
        cleaned = cleaned.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");

        let jsonParsedResponse;
        try {
            jsonParsedResponse = JSON.parse(cleaned);
        } catch (e) {
            console.error("Failed to parse JSON:", feedbackText);
            throw new Error("Gemini did not return valid JSON");
        }

        if (jsonParsedResponse) {
            jsonParsedResponse.answer = answer;
            jsonParsedResponse.question_id = qns_id;
        }

        await this.knex.insert(jsonParsedResponse).into("answers");

        replySuccess(reply, { feedback: jsonParsedResponse });
    } catch (err) {
        console.error("Error generating question:", err);
        replyError(reply, err)
    }
}


async function HISTORY(request, reply) {
    try {
         const user_id = request.user_info.id
        const query = `
      SELECT a.question_id, q.question, a.actual_answer, a.answer
      FROM answers a
      LEFT JOIN questions q ON a.question_id = q.id 
      WHERE q.user_id = ${user_id};
    `
    const getHistory = await this.knex.raw(query);

    replySuccess(reply, { history: getHistory.rowCount ? getHistory.rows : getHistory });
  } catch (err) {
    console.error("Error fetching history:", err);
    replyError(reply,{ ...err,error: "Failed to get answer history" });
  }
}

module.exports = { DEMO, GET_QUESTION, GET_FEEDBACK, HISTORY }