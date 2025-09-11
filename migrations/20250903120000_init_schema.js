// migrations/20250903120000_init_schema.js

export async function up(knex) {
  // Users table
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("username", 255).notNullable().unique();
    table.string("password", 255).notNullable();
    table.string("email", 255).notNullable();
    table.string("mobile", 15);
    table.text("profile_photo");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.boolean("is_active").defaultTo(true);
    table.boolean("is_verified").defaultTo(false);
    table.string("verification_token", 255);
    table.string("reset_password_token", 255);
    table.timestamp("reset_password_expires");
    table.string("first_name", 255);
    table.string("middle_name", 255);
    table.string("last_name", 255);
  });

  // Rooms table
  await knex.schema.createTable("rooms", (table) => {
    table.text("id").primary();
    table.string("room_id").notNullable();
    table.string("owner_username").notNullable();
    table.boolean("is_private").defaultTo(true);
    table.specificType("participants", "text[]").defaultTo("{}");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.text("password");

    table
      .foreign("owner_username")
      .references("username")
      .inTable("users")
      .onDelete("CASCADE");
  });

  await knex.schema.createTable("messages", (table) => {
    table.increments("id").primary();
    table.text("room_id").notNullable();
    table.string("sender_username").notNullable();
    table.text("content").notNullable();
    table.boolean("is_active").defaultTo(true);
    table.timestamp("sent_at").defaultTo(knex.fn.now());

    table
      .foreign("room_id")
      .references("id")
      .inTable("rooms")
      .onDelete("CASCADE");

    table
      .foreign("sender_username")
      .references("username")
      .inTable("users")
      .onDelete("CASCADE");
  });
  await knex.schema.createTable("questions", (table) => {
    table.increments("id").primary();
    table.text("question").notNullable();
    table.integer("difficulty").notNullable();
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");
    table.timestamps(true, true);
  });

  await knex.schema.createTable("answers", (table) => {
    table.increments("id").primary();

    table.text("answer").notNullable();
    table.boolean("is_correct").defaultTo(false);
    table
      .integer("question_id")
      .unsigned()
      .references("id")
      .inTable("questions")
      .onDelete("CASCADE");
    table
      .integer("user_id")
      .unsigned()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");


    table.integer("score");
    table.text("strengths");
    table.text("improvements");
    table.text("missed_points");
    table.text("sarcastic_feedback");
    table.text("positive_feedback");
    table.text("final_feedback");
    table.text("actual_answer");

    table.timestamps(true, true);
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("messages");
  await knex.schema.dropTableIfExists("rooms");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("answers");
  await knex.schema.dropTableIfExists("questions");
}
