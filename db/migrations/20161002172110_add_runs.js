
exports.up = function up(knex) {
  return knex.schema.createTable('runs', (table) => {
    table.increments();
    table.timestamps();
    table.string('status');
    table.integer('duration').unsigned();
    table.string('sandbox_id');
    table.integer('script_id').unsigned().references('id').inTable('scripts');
  });
};

exports.down = function down(knex) {
  return knex.schema.dropTableIfExists('runs');
};
