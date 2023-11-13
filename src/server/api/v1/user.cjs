/* Copyright G. Hemingway, 2023 - All rights reserved */
"use strict";

const Joi = require("joi");
const { filterGameForProfile } = require("../../solitare.cjs");
const sharedPromise = import("../../../shared/index.js");

module.exports = (app) => {
  // Schema for user info validation
  const schema = Joi.object({
    username: Joi.string().lowercase().alphanum().min(3).max(32).required(),
    primary_email: Joi.string().lowercase().email().required(),
    first_name: Joi.string().allow(""),
    last_name: Joi.string().allow(""),
    city: Joi.string().default(""),
    password: Joi.string().min(8).required(),
  });

  /**
   * Create a new user
   *
   * @param {req.body.username} Display name of the new user
   * @param {req.body.first_name} First name of the user - optional
   * @param {req.body.last_name} Last name of the user - optional
   * @param {req.body.city} City user lives in - optional
   * @param {req.body.primary_email} Email address of the user
   * @param {req.body.password} Password for the user
   * @return {201, {username,primary_email}} Return username and others
   */
  app.post("/v1/user", async (req, res) => {
    const { validPassword } = await sharedPromise;
    // Validate user input
    let data;
    try {
      data = await schema.validateAsync(req.body, { stripUnknown: true });
      // Deeper password validation
      const pwdErr = validPassword(data.password);
      if (pwdErr) {
        console.log(`User.create password validation failure: ${pwdErr.error}`);
        return res.status(400).send(pwdErr);
      }
    } catch (err) {
      const message = err.details[0].message;
      console.log(`User.create validation failure: ${message}`);
      return res.status(400).send({ error: message });
    }

    // Try to create the user
    try {
      let user = new app.models.User(data);
      await user.save();
      // Send the happy response back
      res.status(201).send({
        username: data.username,
        primary_email: data.primary_email,
      });
    } catch (err) {
      console.log(err);
      // Error if username is already in use
      if (err.code === 11000) {
        if (err.message.indexOf("username_1") !== -1)
          res.status(400).send({ error: "username already in use" });
        if (err.message.indexOf("primary_email_1") !== -1)
          res.status(400).send({ error: "email address already in use" });
      }
      // Something else in the username failed
      else res.status(400).send({ error: "invalid username" });
    }
  });

  /**
   * See if user exists
   *
   * @param {req.params.username} Username of the user to query for
   * @return {200 || 404}
   */
  app.head("/v1/user/:username", async (req, res) => {
    let user = await app.models.User.findOne({
      username: req.params.username.toLowerCase(),
    });
    if (!user)
      res.status(404).send({ error: `unknown user: ${req.params.username}` });
    else res.status(200).end();
  });

  /**
   * Fetch user information
   *
   * @param {req.params.username} Username of the user to query for
   * @return {200, {username, primary_email, first_name, last_name, city, games[...]}}
   */
  app.get("/v1/user/:username", async (req, res) => {
    let user = await app.models.User.findOne({
      username: req.params.username.toLowerCase(),
    })
      .populate("games")
      .exec();

    if (!user)
      res.status(404).send({ error: `unknown user: ${req.params.username}` });
    else {
      // Filter games data for only profile related info
      const filteredGames = user.games.map((game) =>
        filterGameForProfile(game),
      );
      res.status(200).send({
        username: user.username,
        primary_email: user.primary_email,
        first_name: user.first_name,
        last_name: user.last_name,
        city: user.city,
        games: filteredGames,
      });
    }
  });

  /**
   * Update a user's profile information
   *
   * @param {req.body.first_name} First name of the user - optional
   * @param {req.body.last_name} Last name of the user - optional
   * @param {req.body.city} City user lives in - optional
   * @return {204, no body content} Return status only
   */
  app.put("/v1/user", async (req, res) => {
    if (!req.session.user)
      return res.status(401).send({ error: "unauthorized" });

    const schema = Joi.object({
      first_name: Joi.string().allow(""),
      last_name: Joi.string().allow(""),
      city: Joi.string().allow(""),
    });
    try {
      const data = await schema.validateAsync(req.body, { stripUnknown: true });
      const query = { username: req.session.user.username };
      try {
        req.session.user = await app.models.User.findOneAndUpdate(
          query,
          { $set: data },
          { new: true },
        );
        res.status(204).end();
      } catch (err) {
        console.log(
          `User.update logged-in user not found: ${req.session.user.id}`,
        );
        res.status(500).end();
      }
    } catch (err) {
      const message = err.details[0].message;
      console.log(`User.update validation failure: ${message}`);
      res.status(400).send({ error: message });
    }
  });
};
