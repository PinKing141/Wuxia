"use strict";

export function cause(kind, label, detail){
  return {kind, label, detail};
}

export function effect(kind, label, detail){
  return {kind, label, detail};
}

export function benefit(who, gain, cost=""){
  return {who, gain, cost};
}

export function rumour(verdict, plantedBy=null, note=null){
  if(note == null && plantedBy && !/^[A-Z][\w\s'-]{0,32}$/.test(String(plantedBy))){
    return {verdict, plantedBy:null, note:plantedBy};
  }
  return {verdict, plantedBy, note};
}
