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

module.exports = {demoservice}