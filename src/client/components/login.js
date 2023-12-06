/* Copyright G. Hemingway, @2023 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import {
  ErrorMessage,
  FormBase,
  FormLabel,
  FormInput,
  FormButton,
} from "./shared.js";

export const Login = (props) => {
  let navigate = useNavigate();
  let [username, setUser] = useState("");
  let [password, setPass] = useState("");
  let [loading, setLoading] = useState(false);
  let [error, setError] = useState("");

  const onSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true);
    let res = await fetch("/v1/session", {
      body: JSON.stringify({
        username,
        password,
      }),
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      },
    });
    const data = await res.json();

    setLoading(false);
    if (res.ok) {
      props.logIn(data.username);
      navigate(`/profile/${data.username}`);
    } else {
      setError(`Error: ${data.error}`);
    }
  };

  const authorizeWithGithub = (ev) => {
    ev.preventDefault();
    const CLIENT_ID = 'e0b6b9399f136b75ad88';
    window.location.assign(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}`);
  }

  const getGitHubSession = async (code) => {
    setLoading(true);

    let res = await fetch("v1/third_party_session", {
      body: JSON.stringify({
        code
      }),
      method: "POST",
      credentials: "include",
      headers: {
        "content-type": "application/json",
      }
    });

    const data = await res.json();

    setLoading(false);

    return;

    if (res.ok) {
      props.logIn(data.username);
      navigate(`/profile/${data.username}`);
    } else {
      setError(`Error: ${data.error}`);
    }
  }

  useEffect(() => {
    document.getElementById("username").focus();

    const urlParams = new URLSearchParams(window.location.search);
    const gitHubCode = urlParams.get("code");

    if (gitHubCode) {
      getGitHubSession(gitHubCode);
    }
  }, []);
  

  return (
    <div style={{ gridArea: "main" }}>
      <ErrorMessage msg={error} />
      <FormBase>
        <FormLabel htmlFor="username">Username:</FormLabel>
        <FormInput
          id="username"
          name="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(ev) => setUser(ev.target.value.toLowerCase())}
        />

        <FormLabel htmlFor="password">Password:</FormLabel>
        <FormInput
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(ev) => setPass(ev.target.value)}
        />
        <div />
        <FormButton id="submitBtn" onClick={onSubmit}>
          Login
        </FormButton>
        <br></br>
        <FormButton 
          style={{ marginTop: '3px' }}
          onClick={authorizeWithGithub}
          >
          Login with GitHub</FormButton>
        </FormBase>
    </div>
  );
};

Login.propTypes = {
  logIn: PropTypes.func.isRequired,
};
