# Express Project Skeleton

Use this project skeleton as a starting point for structuring your app. Things to note
* Sequelize configuration has not yet been added -- you will need to set that up yourself
* You may find yourself wanting to use javascript -- js files can be added in `public/javascripts` and should be appended to the Pug templates as needed
* CSS files can go in `public/stylesheets` and also will need to be added to Pug templates


# Development Log

* decided to try to keep it simple
* served straight html files first
* then had to move to ejs for inserting variables

* created .env file variables
* created database user manually 
  * CREATE ROLE zinegarden_app WITH CREATEDB PASSWORD 'hunter12';
* created database manually with owner
  * CREATE DATABASE zinegarden_db WITH OWNER zinegarden_app;

* tried to run $ npx dotenv sequelize-cli db:create
  * got ERROR: role "zinegarden_app" is not permitted to log in
  * changed pg version --> "pg": "^8.4.2" from "^8.6.0
  * copied entire package.json over from working pug project (slacker news)
  * deleted node_modules manually, dropped the user and db
  * then created user again with "password" for password
  * then ran $ npx dotenv sequelize-cli db:create
  * that seemed to work 👍

* then started making models
  * $ npx sequelize-cli model:generate --name User --attributes username:string,userType:string,passwordHash:string

* added allowNull false and one basic relationship to User model
```js
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
```

* then clean up the Users migration to make sure it matches the model

* then create the Zines model
* then clean that model up, add allownulls, stringlengths, relationships etc

---

* worked for a while getting ui and forms mocked up
* figured out how to pass csf tokens and errors back and forth in the request and response objects
* still reliant on a couple of libraries that might be unnecessary
  * including express-validators

* consolidated auth.js helper functions into app.js

* going back to database work to confirm and persist signup form
* first need to migrate pending users migrations

* double-checked that migration file was in line with desired model then tried

* create new migration for zines

```bash
  npx sequelize-cli model:generate --name Zine --attributes url:string,title:string,userId:integer,author:integer,productionCity:string,productionDate:date
```

* npx dotenv sequelize-cli db:migrate

## TO RESET THE DATABASE

* $ npx dotenv sequelize-cli db:drop
* $ npx dotenv sequelize-cli db:create
* $ npx dotenv sequelize-cli db:migrate
* $ npx dotenv sequelize-cli db:seed:all

* got delete conditionally rendering and working on the backend
* now getting aws integrated

## AWS Integration

* npm install @aws-sdk/client-s3
