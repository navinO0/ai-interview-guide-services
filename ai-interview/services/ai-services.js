const demoservice = async(app, userDetails) => {
    try {
        const [response] = await app.knex('users')
    .insert(userDetails)
    .returning(['username', 'email', 'mobile', 'first_name', 'middle_name', 'last_name']);

return response;
    } catch (error) {
        throw new Error("user creation failed :" + error);   
    }
}


function getDifficultyLevel(difficulty) {
  switch (difficulty.toLowerCase()) {
    case "easy":
      return 1;
    case "medium":
      return 2;
    case "hard":
      return 3;
    default:
      return 0; 
  }
}

module.exports = {demoservice, getDifficultyLevel}