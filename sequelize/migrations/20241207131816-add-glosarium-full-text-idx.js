module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(
      `CREATE FULLTEXT INDEX idx_meaning ON glosarium(meaning)`
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`DROP INDEX idx_meaning ON glosarium`);
  },
};
