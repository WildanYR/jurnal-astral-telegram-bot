"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_chat_update", {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      chat_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      previous_message_id: {
        type: Sequelize.BIGINT,
      },
      chat_thread_id: {
        type: Sequelize.BIGINT,
      },
      order_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("now"),
      },
    });
    await queryInterface.addConstraint("order_chat_update", {
      fields: ["order_id"],
      type: "FOREIGN KEY",
      name: "fk_order_order_chat_update",
      references: {
        table: "order",
        field: "id",
      },
      onDelete: "cascade",
      onUpdate: "cascade",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("order_chat_update");
  },
};
