//Import React hooks
import { useCallback, useEffect, useState } from "react";


/**
 * Client-side Bridge API namespace for communicating with the localhost server on port 16000.
 */
export let BridgeClient = {
  /**
   * Fetches the full orchestrator and validation state payload from /api/state.
   *
   * @param {string} [arg0_base_url=""]
   *
   * @returns {Promise<Object|null>}
   */
  fetchState: async function (arg0_base_url) {
    //Convert from parameters
    let base_url = (arg0_base_url) ? arg0_base_url : "";

    try {
      let res = await fetch(`${base_url}/api/state`);
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("BridgeClient.fetchState failed:", err);
    }

    //Return statement
    return null;
  },


  /**
   * Triggers a single pipeline or figure compilation task by ID via POST /api/run.
   *
   * @param {string} arg0_pipeline_id
   * @param {string} [arg1_base_url=""]
   *
   * @returns {Promise<Object|null>}
   */
  triggerPipeline: async function (arg0_pipeline_id, arg1_base_url) {
    //Convert from parameters
    let pipeline_id = arg0_pipeline_id;
    let base_url = (arg1_base_url) ? arg1_base_url : "";

    //Guard clauses
    if (!pipeline_id) return null;

    try {
      let res = await fetch(`${base_url}/api/run`, {
        body: JSON.stringify({ pipeline_id: pipeline_id }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("BridgeClient.triggerPipeline failed:", err);
    }

    //Return statement
    return null;
  },


  /**
   * Triggers a top-level macro stage ('generate_data', 'run_tests', 'generate_figures')
   * via POST /api/run-stage.
   *
   * @param {string} arg0_stage_id
   * @param {string} [arg1_base_url=""]
   *
   * @returns {Promise<Object|null>}
   */
  triggerStage: async function (arg0_stage_id, arg1_base_url) {
    //Convert from parameters
    let stage_id = arg0_stage_id;
    let base_url = (arg1_base_url) ? arg1_base_url : "";

    //Guard clauses
    if (!stage_id) return null;

    try {
      let res = await fetch(`${base_url}/api/run-stage`, {
        body: JSON.stringify({ stage_id: stage_id }),
        headers: { "Content-Type": "application/json" },
        method: "POST"
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.error("BridgeClient.triggerStage failed:", err);
    }

    //Return statement
    return null;
  }
};


/**
 * React hook that polls the localhost Bridge API and exposes trigger methods for
 * individual tree nodes and top-right macro stage buttons.
 *
 * @param {Object} [arg0_options]
 *  @param {string} [arg0_options.base_url=""]
 *  @param {number} [arg0_options.poll_ms=1200]
 *
 * @returns {Object}
 */
export function useBridgeAPI (arg0_options) {
  //Convert from parameters
  let options = (arg0_options) ? arg0_options : {};

  //Initialise options
  if (options.base_url === undefined) options.base_url = "";
  if (options.poll_ms === undefined) options.poll_ms = 1200;

  //Declare local instance variables
  let [is_loading, setIsLoading] = useState(true);
  let [state_data, setStateData] = useState(null);

  let refreshState = useCallback(async () => {
    let payload = await BridgeClient.fetchState(options.base_url);
    if (payload) {
      setStateData(payload);
      setIsLoading(false);
    }
  }, [options.base_url]);

  let triggerPipeline = useCallback(async (arg0_pipeline_id) => {
    let pipeline_id = arg0_pipeline_id;
    if (!pipeline_id) return;
    await BridgeClient.triggerPipeline(pipeline_id, options.base_url);
    await refreshState();
  }, [options.base_url, refreshState]);

  let triggerStage = useCallback(async (arg0_stage_id) => {
    let stage_id = arg0_stage_id;
    if (!stage_id) return;
    await BridgeClient.triggerStage(stage_id, options.base_url);
    await refreshState();
  }, [options.base_url, refreshState]);

  useEffect(() => {
    refreshState();
    let poll_handle = setInterval(() => {
      refreshState();
    }, options.poll_ms);
    return () => clearInterval(poll_handle);
  }, [options.poll_ms, refreshState]);

  //Return statement
  return {
    isLoading: is_loading,
    refreshState: refreshState,
    stateData: state_data,
    triggerPipeline: triggerPipeline,
    triggerStage: triggerStage
  };
}

