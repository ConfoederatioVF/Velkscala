//Import libraries and components
import React from "react";
import { createRoot } from "react-dom/client";
import { OpenTUIProvider } from "../framework/index_ui.js";
import { VelkscalaTUIApp } from "./components/VelkscalaTUIApp.jsx";


/**
 * Initialises and mounts the OpenTUI React frontend on port 16000.
 */
function initVelkscalaUI () {
  //Declare local instance variables
  let container_el = document.getElementById("root");
  let root_instance;

  //Guard clauses
  if (!container_el) {
    console.error("Root mount element #root not found.");
    return;
  }

  root_instance = createRoot(container_el);
  root_instance.render(
    <OpenTUIProvider>
      <VelkscalaTUIApp />
    </OpenTUIProvider>
  );
}

initVelkscalaUI();
