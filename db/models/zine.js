'use strict';
module.exports = (sequelize, DataTypes) => {
  const Zine = sequelize.define('Zine', {
    url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    author: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    productionCity: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    productionDate: {
      type: DataTypes.DATE,
      allowNull: true 
    }
  }, {});
  Zine.associate = function(models) {
    Zine.belongsTo(models.User, {
      as: 'user',
      foreignKey: 'userId'
    });
  };
  return Zine;
};