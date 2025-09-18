const { replySuccess, replyError } = require("../../core/core_funcs");
const { demoservice, getDifficultyLevel } = require("../services/ai-services");

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
        const {
            role = "software engineer",
            difficulty: level = "easy",
            topic = "",
            have_jd = false,
            jobDescription: job_description = "",
            company = "",
            question_type = "General"
        } = request.body,
            { id: userId } = request.user_info;

        const questions_asked_raw = await this.knex("questions as q")
            .where("user_id", userId)
            .whereNot("q.question_type", "coding")
            .select(this.knex.raw("json_agg(question) as qns"));

        const questions_asked = questions_asked_raw.rowCount > 0 ? questions_asked_raw.rows[0].qns : []
        const concatQns = questions_asked.join(",")
        const prompt = `
            Ask ONE clear and direct interview question.  
            
            ${have_jd
                ? `Base the question strictly on the following job description (JD):\n${job_description}\n`
                : `Base the question on the given context:\n${topic ? `- Topic: ${topic}\n` : ""}- Role: ${role}\n- Level: ${level}\n - question_type: ${question_type}\n`
            }

            ${question_type && question_type.toLowerCase() === "coding"
                ? "The question must be a coding challenge(with code snippet). Format the response in Markdown with sections like **Problem Statement**, **Input Format**, **Output Format**, and include at least one example inside a fenced code block (```)."
                : "Format the question in Markdown (e.g., start with a heading ###, bold important keywords if needed)."
            }

            Make sure the question is relevant, concise, and grammatically correct.
            Here are the questions so far asked for the reference purpose to not get duplicate : ${concatQns}
            Return only the question, nothing else.
        `;




        const response = await this.
            AiModel.generateContent(prompt);
        const questionText = response.response.text().trim();

        const sampleQuestion = {
            question: questionText,
            difficulty: getDifficultyLevel(level),
            user_id: userId,
            company: company,
            question_type: question_type,
            job_description,
            topic,
            role
        };

        const questionResponse = await this.knex
            .insert(sampleQuestion)
            .into("questions")
            .returning("id");

        replySuccess(reply, { question: questionText, qns_id: questionResponse[0].id })
    } catch (err) {
        console.error("Error generating question:", err);
        replyError(reply, err)
    }
}

async function GET_FEEDBACK(request, reply) {
    try {
        const { answer = '', role = "software engineer", question = "what is the use of ai", qns_id = 0 } = request.body;

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
        jsonParsedResponse.userAnswer = answer
        jsonParsedResponse.question = question
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
      SELECT a.question_id, q.question, a.actual_answer, a.answer, q.role, q.question_type, q.company
      FROM answers a
      LEFT JOIN questions q ON a.question_id = q.id 
      WHERE q.user_id = ${user_id} order by q.created_at desc;
    `
        const getHistory = await this.knex.raw(query);

        replySuccess(reply, { history: getHistory.rowCount > 0 ? getHistory.rows : [] });
    } catch (err) {
        console.error("Error fetching history:", err);
        replyError(reply, { ...err, error: "Failed to get answer history" });
    }
}

module.exports = { DEMO, GET_QUESTION, GET_FEEDBACK, HISTORY }