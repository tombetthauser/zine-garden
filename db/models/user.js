'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    username: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    passwordHash: {
      type: DataTypes.STRING.BINARY,
      allowNull: false
    },
    userType: {
      type: DataTypes.STRING(16),
      allowNull: true
    }
  }, {});
  User.associate = function(models) {
    User.hasMany(models.Post, {
      as: 'zines',
      foreignKey: 'userId',
      onDelete: 'CASCADE'
    });
  };
  return User;
};