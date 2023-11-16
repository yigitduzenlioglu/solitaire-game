/* Copyright G. Hemingway, @2023 - All rights reserved */
"use strict";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styled from "styled-components";
import { Pile } from "./pile.js";

const CardRow = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  justify-content: center;
  align-items: flex-start;
  margin-bottom: 2em;
`;

const CardRowGap = styled.div`
  flex-grow: 2;
`;

const GameBase = styled.div`
  grid-row: 2;
  grid-column: sb / main;
`;

export const Game = () => {
  const { id } = useParams();
  let [state, setState] = useState({
    pile1: [],
    pile2: [],
    pile3: [],
    pile4: [],
    pile5: [],
    pile6: [],
    pile7: [],
    stack1: [],
    stack2: [],
    stack3: [],
    stack4: [],
    draw: [],
    discard: [],
  });
  let [selected, setSelected] = useState(undefined);
  let [selectedSource, setSelectedSource] = useState(undefined);
  let [target, setTarget] = useState(undefined);
  let [targetDestination, setTargetDestination] = useState(undefined);
  // let [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const updateGameMove = async (gameId, move) => {
    const url = `/v1/game/${gameId}`;
    const requestOptions = {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ move })
    };

    try {
      const response = await fetch(url, requestOptions);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error occurred while updating the game');
      }

      console.log('Game state updated successfully:', data);
    } catch (error) {
      console.error('Failed to update game state:', error.message);
    }
  };

  useEffect(() => {
    const getGameState = async () => {
      const response = await fetch(`/v1/game/${id}`);
      const data = await response.json();
      setState({
        pile1: data.pile1,
        pile2: data.pile2,
        pile3: data.pile3,
        pile4: data.pile4,
        pile5: data.pile5,
        pile6: data.pile6,
        pile7: data.pile7,
        stack1: data.stack1,
        stack2: data.stack2,
        stack3: data.stack3,
        stack4: data.stack4,
        draw: data.draw,
        discard: data.discard,
      });
    };
    getGameState();
  }, [id]);

  function isValidMove() {
    const dst = targetDestination === 'draw' ? 'draw'
        : targetDestination === 'discard' ? 'discard'
            : targetDestination.includes('pile') ? 'pile'
                : 'stack';

    const src = selectedSource === 'draw' ? 'draw'
        : selectedSource === 'discard' ? 'discard'
            : selectedSource.includes('pile') ? 'pile'
                : 'stack';

    // * -> draw
    if (dst === 'draw') {
      return false;
    }

    // draw -> discard
    if (dst === 'draw' && dst === 'discard') {
      return true;
    }

    // draw -> pile, stack, draw
    if (src === 'draw') {
      return false;
    }

    // pile, stack, discard -> discard
    if (['pile', 'stack', 'discard'].includes(src) && dst === 'discard') {
      return false;
    }

    // stack -> stack
    if (src === 'stack' && dst === 'stack') {
      return false;
    }

    function selectedHasOneMoreValueThanTarget() {
      const values = ["ace", "2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king"];

      const targetIndex = values.findIndex(v => v === target.value);
      const selectedIndex = values.findIndex(v =>  v === selected.value);

      return targetIndex === selectedIndex + 1;
    }

    // pile, discard -> stack
    if (['pile', 'discard'].includes(src) && dst === 'stack') {
      return selected.suit === target.suit && selectedHasOneMoreValueThanTarget();
    }

    // pile, stack, discard -> pile
    if (['pile', 'stack', 'discard'].includes(src) && dst === 'pile') {
      const bothRed = ["hearts", "diamonds"].includes(selected.suit) && ["hearts", "diamonds"].includes(target.suit);
      const bothBlack = ["clubs", "spades"].includes(selected.suit) && ["clubs", "spades"].includes(target.suit);

      return !(bothRed || bothBlack) && selectedHasOneMoreValueThanTarget();
    }
  }

  useEffect(() => {
    if (selected === undefined || target === undefined) return;

    if(!isValidMove()) {
      alert("malsin");
      return;
    }


    const newState = {...state};

    const i = newState[selectedSource].findIndex(v => v.suit === selected.suit && v.value === selected.value);

    const cards = newState[selectedSource].slice(i);
    newState[targetDestination] = newState[targetDestination].concat(cards);
    newState[selectedSource] = newState[selectedSource].slice(0, i);
    newState[selectedSource][newState[selectedSource].length - 1].up = true;

    setState(newState);

    const gameId = window.location.pathname.split('/')[2]

    const move = {
      user : localStorage.getItem("user").username,
      game : gameId,
      cards: cards,
      src: selectedSource,
      dst: targetDestination,
      date: new Date()
    };

    updateGameMove(gameId, move);

    setSelected(undefined);
    setSelectedSource(undefined);
  }, [target]);

  const onClick = (card, source) => {
    console.log('card', card);
    console.log('source', source);

    if(selected === undefined){
      setTarget(undefined);
      setTargetDestination(undefined);
      setSelected(card);
      setSelectedSource(source);
    } else {
      setTarget(card);
      setTargetDestination(source);
    }

  };

  return (
      <GameBase>
        <CardRow>
          {
            [1,2,3,4].map((x, i) =>
                <Pile key={x} cards={state[`stack${x}`]} spacing={0} onCardClick={(card) => onClick(card, `stack${x}`)} />
            )
          }
          <CardRowGap />
          <Pile cards={state.draw} spacing={0} onCardClick={(card) => onClick(card, 'draw')} />
          <Pile cards={state.discard} spacing={0} onCardClick={(card) => onClick(card, 'discard')} />
        </CardRow>
        <CardRow>
          {
            [1,2,3,4,5,6,7].map((x, i) =>
                <Pile key={x} cards={state[`pile${x}`]} spacing={10} onCardClick={(card) => onClick(card, `pile${x}`)} />
            )
          }
        </CardRow>
      </GameBase>
  );
};

Game.propTypes = {};
