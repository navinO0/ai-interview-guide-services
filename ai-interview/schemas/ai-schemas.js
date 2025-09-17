const demoschema = {
    tags: ['ai-interview'],
    summary: "User Registration and Login",
    description: `<h3>This API allows users to register, login, and manage their accounts.</h3>`,
    rbac: ["*"],
    // body: {
    //     type: "object",
    //     properties: {
    //     },
    //     // required: ["username", "password"],  // Make username, password, and email required
    //     additionalProperties: false
    // }
};


const get_questions_schema = {
     tags: ["ai-interview"],
  summary: "Fetch Interview Question",
  description: `<h3>This API provides interview questions based on role, difficulty, topic, and job description.</h3>`,
  rbac: ["*"],
  req_encrypted: false,
  encrypted_properties: [],
    body: {
        type: "object",
        properties: {
            role: {
                type: "string",
                description: "Job role for the interview question",
                example: "node.js backend developer"
            },
            difficulty: {
                type: "string",
                // enum: ["easy", "medium", "hard"],
                description: "Difficulty level of the interview question",
                example: "medium"
            },
            topic: {
                type: "string",
                description: "Optional topic or subtopic of the interview question",
                example: "databases"
            },
            jobDescription: {
                type: "string",
                description: "Full job description text to contextualize the interview questions",
                example: "We are looking for a Node.js backend developer with experience in PostgreSQL, Redis, and scalable APIs."
          },
            company : {
                type: "string",
                description: "Name of the company",
                example: "Google"
          },
            have_jd : {
                type: "boolean",
                description: "Indicates whether the job description is provided",
                example: true
          },
            question_type : {
                type: "string",
                description: "Type of the interview question",
                example: "coding"
          }
        },
        required: ["role"],
        additionalProperties: false
    }
}


const get_feedback_schema = 
    {
  tags: ["ai-interview"],
  summary: "Submit Interview Feedback",
  description: `<h3>This API allows users to submit their answers for interview questions and receive feedback.</h3>`,
  rbac: ["*"],
  req_encrypted: false,
  encrypted_properties: [],
  body: {
    type: "object",
    properties: {
      role: {
        type: "string",
        description: "Job role for which the interview is being attempted",
        example: "node.js backend developer"
      },
      answer: {
        type: "string",
        description: "User's submitted answer to the interview question",
        example: "process.nextTick() executes before any I/O events in the event loop, while setImmediate() runs after I/O events."
      },
      question: {
        type: "string",
        description: "The interview question text",
        example: "Describe the differences between `process.nextTick()` and `setImmediate()` in Node.js, and when you might choose to use one over the other."
      },
      qns_id: {
        type: "integer",
        description: "Unique ID of the interview question",
        example: 19
      }
    },
    required: ["role", "answer", "question", "qns_id"],
    additionalProperties: false
  }


}



module.exports = { demoschema, get_questions_schema, get_feedback_schema };