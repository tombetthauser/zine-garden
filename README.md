# Zine Garden 🌷

A work in progress web interface for building printable zine files. For the time working fine for small / medium file processing but unstable and very slow for reasonably large processing jobs.

---

## Development Log

Some notes on the build-out process for this applications. These need to be cleaned up but are place-holders and reminders more than they are instructions.

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
* followed s3-express demo repo / copied repo onto my github
* had to add enctype="multipart/form-data" to form to get everything working
* the rest ended up being pretty boilerplate but irritating to piece together

## Heroku Deployment

* heroku create -a example-app
* git push heroku main

* went through heroku and you instructions in mfahole / slacker-news repo
* checked config vars on heroku
* on heroku DATABASE_URL stands in for DB_USERNAME, DB_PASSWORD, DB_DATABASE in .env
* then had to add to update config/database.js to have production section like this

```javascript
  const {
    db: { username, password, database, host },
  } = require('./index');

  module.exports = {
    development: {
      username,
      password,
      database,
      host,
      dialect: 'postgres',
      seederStorage: 'sequelize',
    },
    production: {
      use_env_variable: 'DATABASE_URL',
      dialect: 'postgres',
      seederStorage: 'sequelize',
      dialectOptions: {
        ssl: {
          rejectUnauthorized: false
        }
      }
    }
  };
```

* this seemed to stop the heroku "check log --tails" crash
* then just had to run --> heroku run npx sequelize-cli db:migrate
* these are some other useful heroku sequelize commands:
  * heroku run npx sequelize-cli db:seed:undo:all
  * heroku run npx sequelize-cli db:migrate:undo:all
  * heroku run npx sequelize-cli db:seed:all


## DNS Rerouting

* purchased domain on dreamhost
* started following instructions at <https://devcenter.heroku.com/articles/custom-domains>
* first ran --> $ heroku domains:add www.zine.garden
* to see records to put into dreamhost had to run --> $ heroku domains


## PDF Combiner

* followed youtube walkthrough here
  * https://www.youtube.com/watch?v=vZPk0wHdnSk
* written instructions for walkthrough here
  * https://codingshiksha.com/javascript/node-js-express-convert-png-jpg-images-to-single-pdf-file-web-app-using-imagemagick-library-deployed-to-heroku-2020/
* repo for walkthrough here:
  * https://github.com/gauti123456/imagestopdf/blob/master/index.js

* integrated code, had to make two separate storage variables, one for aws and one for the pdf combiner
* working locally but crashing with an H13 heroku error on deployment
* went to settings in heroku project and went to "add build pack" and pasted the following
  * https://github.com/DuckyTeam/heroku-buildpack-imagemagick.git

* redeployed app with $ git push heroku main
* still working fine locally but crashing with a Heroku --tail message [H14 / 503] on the deployed version
* checked free dyno hours with:
  * $ heroku ps -a app-name
* still had 500 free hours remaining

* removed buildpack from heroku browser interface
* looked up how to install imagemagick via heroku docs
* installed imagemagick through the cli
  * $ heroku buildpacks:add https://github.com/DuckyTeam/heroku-buildpack-imagemagick --index 1 --app zine-garden
  * then made a trivial text change and ran $ git push heroku main

* Now it works!


## Adding More Complex Bash Script Files

* $ heroku run bash
