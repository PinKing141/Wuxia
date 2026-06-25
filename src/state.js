"use strict";

export let STATE;

export function setState(nextState){
  STATE = nextState;
}

export function newId(){
  return STATE.idc++;
}
