/* Copyright G. Hemingway, 2023 - All rights reserved */
"use strict";

const Joi = require("joi");

const CLIENT_ID = "e0b6b9399f136b75ad88";
const CLIENT_SECRET = "ec4268821c95e3da4850f9e5734489a06c325bac";

module.exports = (app) => {
  /**
   * Log a user in
   *
   * @param {req.body.username} Username of user trying to log in
   * @param {req.body.password} Password of user trying to log in
   * @return { 200, {username, primary_email} }
   */
  app.post("/v1/session", async (req, res) => {
    // Validate incoming request has username and password, if not return 400:'username and password are required'
    const schema = Joi.object({
      username: Joi.string().lowercase().required(),
      password: Joi.string().required(),
    });
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Search database for user
      try {
        let user = await app.models.User.findOne({ username: data.username });
        if (!user) res.status(401).send({ error: "unauthorized" });
        else if (await user.authenticate(data.password)) {
          // Regenerate session when signing in to prevent fixation
          req.session.regenerate(() => {
            req.session.user = user;
            console.log(`Session.login success: ${req.session.user.username}`);
            // If a match, return 201:{ username, primary_email }
            res.status(200).send({
              username: user.username,
              primary_email: user.primary_email,
            });
          });
        } else {
          // If not a match, return 401:unauthorized
          console.log(`Session.login failed.  Incorrect credentials.`);
          res.status(401).send({ error: "unauthorized" });
        }
      } catch (err) {
        res.status(500).send({ error: "internal server error" });
      }
    } catch (err) {
      console.log(err);
      const message = err.details[0].message;
      console.log(`Session.login validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });

  app.post("/v1/third_party_session", async (req, res) => {

    const query_params = "?client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET + "&code=" + req.query.code;

    await fetch("https://github.com/login/oauth/access_token" + query_params, {
        method: "POST",
        headers: {
          "accept": "application/json"
        }
      }
    ).then((response) => {
      return response.json();
    }).then((data) => {
      console.log("access token response", data);
      res.status(200).json(data);
    })

    // await getGitHubUserData(token);
  });

  /**
   * Log a user out
   *
   * @return { 204 if was logged in, 200 if no user in session }
   */
  app.delete("/v1/session", (req, res) => {
    if (req.session.user) {
      req.session.destroy(() => {
        res.status(204).end();
      });
    } else {
      res.status(200).end();
    }
  });
};
