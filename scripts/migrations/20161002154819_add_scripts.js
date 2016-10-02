
exports.up = function up(knex) {
  return knex.schema.createTable('scripts', (table) => {
    table.increments();
    table.timestamps();
    table.text('content');
  });
};

exports.down = function down(knex) {
  return knex.dropTable('scripts');
};
