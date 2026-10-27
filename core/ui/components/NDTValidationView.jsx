//Import React hooks and core/framework UI helpers
import React, { useMemo, useState } from "react";
import { formatEuroNumber, formatYearBCAD, SortHeader, useSortableData } from "../../framework/index_ui.js";


/**
 * Tab 2: Neolithic Demographic Transition (NDT) Validation (Sortable, non-bold cells outside col 1).
 *
 * @param {Object} arg0_props
 *  @param {Object} arg0_props.ndtData
 *
 * @returns {React.ReactElement}
 */
export function NDTValidationView (arg0_props) {
  //Convert from parameters
  let ndt_data = arg0_props.ndtData;

  //Declare local instance variables
  let region_keys = ndt_data?.regional_data ? Object.keys(ndt_data.regional_data) : [];
  let [selected_hearth, setSelectedHearth] = useState("Southwest Asia");

  let scorecard_raw = useMemo(() => {
    let entries = Object.entries(ndt_data?.scorecard || {});
    return entries.map(([name, sc]) => ({
      ...sc,
      name: name
    }));
  }, [ndt_data]);

  let { items: sc_items, requestSort: requestScSort, sortConfig: scSortCfg } = useSortableData(
    scorecard_raw,
    { direction: "desc", key: "peak_early_growth_rate" }
  );

  let hearth_epochs_raw = ndt_data?.regional_data?.[selected_hearth]?.epochs || [];
  let { items: traj_items, requestSort: requestTrajSort, sortConfig: trajSortCfg } = useSortableData(
    hearth_epochs_raw,
    { direction: "asc", key: "year" }
  );

  let geocodes_raw = useMemo(() => {
    let entries = Object.entries(ndt_data?.tracked_geocodes || {});
    return entries.map(([code, g]) => ({
      code: code,
      name: g.info?.name || code,
      p0: g.benchmark_epochs?.["0"]?.population ?? 0,
      p0_15p5: g.benchmark_epochs?.["0"]?.p_5_19_bocquet_pct ?? 0,
      p2000: g.benchmark_epochs?.["-2000"]?.population ?? 0,
      p2000_15p5: g.benchmark_epochs?.["-2000"]?.p_5_19_bocquet_pct ?? 0,
      p6000: g.benchmark_epochs?.["-6000"]?.population ?? 0,
      p6000_15p5: g.benchmark_epochs?.["-6000"]?.p_5_19_bocquet_pct ?? 0,
      region: g.info?.region || ""
    }));
  }, [ndt_data]);

  let { items: geo_items, requestSort: requestGeoSort, sortConfig: geoSortCfg } = useSortableData(
    geocodes_raw,
    { direction: "asc", key: "code" }
  );

  //Return statement
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Table 2.1: Cross-Hearth Scorecard */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
          Table 2.1 — Agricultural hearth benchmarks (Bocquet-Appel &amp; Shennan priors)
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Hearth" onSort={() => requestScSort("name")} sortConfig={scSortCfg} sortKey="name" />
                <SortHeader label="Neolithic onset" onSort={() => requestScSort("onset_label")} sortConfig={scSortCfg} sortKey="onset_label" />
                <SortHeader isNum={true} label="Pre-NDT growth" onSort={() => requestScSort("pre_growth_rate_clean")} sortConfig={scSortCfg} sortKey="pre_growth_rate_clean" />
                <SortHeader isNum={true} label="Peak boom growth" onSort={() => requestScSort("peak_early_growth_rate")} sortConfig={scSortCfg} sortKey="peak_early_growth_rate" />
                <SortHeader label="Peak interval" onSort={() => requestScSort("peak_early_interval")} sortConfig={scSortCfg} sortKey="peak_early_interval" />
                <SortHeader isNum={true} label="Pre 15P5" onSort={() => requestScSort("ijp_pre_mean")} sortConfig={scSortCfg} sortKey="ijp_pre_mean" />
                <SortHeader isNum={true} label="Peak 15P5" onSort={() => requestScSort("ijp_boom_peak")} sortConfig={scSortCfg} sortKey="ijp_boom_peak" />
                <SortHeader isNum={true} label="15P5 gain (Δ)" onSort={() => requestScSort("ijp_delta_pp")} sortConfig={scSortCfg} sortKey="ijp_delta_pp" />
              </tr>
            </thead>
            <tbody>
              {sc_items.map((sc) => (
                <tr key={sc.name}>
                  <td><strong>{sc.name}</strong></td>
                  <td>{sc.onset_label}</td>
                  <td className="num">{formatEuroNumber(sc.pre_growth_rate_clean, { decimals: 3, is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.peak_early_growth_rate, { decimals: 3, is_already_percent: true, is_signed: true })}</td>
                  <td>{sc.peak_early_interval}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_pre_mean, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_boom_peak, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(sc.ijp_delta_pp, { is_signed: true })} pp</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2.2: Regional Trajectory Table */}
      <div>
        <div style={{ alignItems: "center", display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 700 }}>
            Table 2.2 — Paleodemographic trajectory (10000 BC–1000 AD) — {selected_hearth}
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {region_keys.map((k) => (
              <button
                className={`linear-btn linear-btn-sm ${selected_hearth === k ? "linear-btn-primary" : ""}`}
                key={k}
                onClick={() => setSelectedHearth(k)}
                type="button"
              >
                {k}
              </button>
            ))}
          </div>
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Epoch" onSort={() => requestTrajSort("year")} sortConfig={trajSortCfg} sortKey="year" />
                <SortHeader label="Stage" onSort={() => requestTrajSort("stage")} sortConfig={trajSortCfg} sortKey="stage" />
                <SortHeader isNum={true} label="Stadestér pop" onSort={() => requestTrajSort("pop_stadester")} sortConfig={trajSortCfg} sortKey="pop_stadester" />
                <SortHeader isNum={true} label="HYDE pop" onSort={() => requestTrajSort("pop_hyde")} sortConfig={trajSortCfg} sortKey="pop_hyde" />
                <SortHeader isNum={true} label="Growth (%/yr)" onSort={() => requestTrajSort("growth_rate_pct")} sortConfig={trajSortCfg} sortKey="growth_rate_pct" />
                <SortHeader isNum={true} label="Cropland (km²)" onSort={() => requestTrajSort("cropland_km2")} sortConfig={trajSortCfg} sortKey="cropland_km2" />
                <SortHeader isNum={true} label="Under-5 share" onSort={() => requestTrajSort("p_under5_pct")} sortConfig={trajSortCfg} sortKey="p_under5_pct" />
                <SortHeader isNum={true} label="15P5 index" onSort={() => requestTrajSort("p_5_19_bocquet_pct")} sortConfig={trajSortCfg} sortKey="p_5_19_bocquet_pct" />
              </tr>
            </thead>
            <tbody>
              {traj_items.map((r) => (
                <tr key={r.year}>
                  <td><strong>{formatYearBCAD(r.year)}</strong></td>
                  <td><span className="linear-badge">{r.stage}</span></td>
                  <td className="num">{formatEuroNumber(r.pop_stadester, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(r.pop_hyde, { use_abbreviation: true })}</td>
                  <td className="num">
                    {(r.growth_rate_pct !== null)
                      ? formatEuroNumber(r.growth_rate_pct, { decimals: 3, is_already_percent: true, is_signed: true })
                      : "—"}
                  </td>
                  <td className="num">{formatEuroNumber(r.cropland_km2, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(r.p_under5_pct, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(r.p_5_19_bocquet_pct, { is_already_percent: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 2.3: Geocodes Audit */}
      <div>
        <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px" }}>
          Table 2.3 — Anchor geocode audit (6000 BC, 2000 BC, 0 AD)
        </div>
        <div className="linear-table-container">
          <table className="linear-table">
            <thead>
              <tr>
                <SortHeader label="Geocode" onSort={() => requestGeoSort("name")} sortConfig={geoSortCfg} sortKey="name" />
                <SortHeader label="Region" onSort={() => requestGeoSort("region")} sortConfig={geoSortCfg} sortKey="region" />
                <SortHeader isNum={true} label="6000 BC Pop" onSort={() => requestGeoSort("p6000")} sortConfig={geoSortCfg} sortKey="p6000" />
                <SortHeader isNum={true} label="6000 BC 15P5" onSort={() => requestGeoSort("p6000_15p5")} sortConfig={geoSortCfg} sortKey="p6000_15p5" />
                <SortHeader isNum={true} label="2000 BC Pop" onSort={() => requestGeoSort("p2000")} sortConfig={geoSortCfg} sortKey="p2000" />
                <SortHeader isNum={true} label="2000 BC 15P5" onSort={() => requestGeoSort("p2000_15p5")} sortConfig={geoSortCfg} sortKey="p2000_15p5" />
                <SortHeader isNum={true} label="0 AD Pop" onSort={() => requestGeoSort("p0")} sortConfig={geoSortCfg} sortKey="p0" />
                <SortHeader isNum={true} label="0 AD 15P5" onSort={() => requestGeoSort("p0_15p5")} sortConfig={geoSortCfg} sortKey="p0_15p5" />
              </tr>
            </thead>
            <tbody>
              {geo_items.map((g) => (
                <tr key={g.code}>
                  <td><strong>{g.name}</strong></td>
                  <td>{g.region}</td>
                  <td className="num">{formatEuroNumber(g.p6000, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p6000_15p5, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(g.p2000, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p2000_15p5, { is_already_percent: true })}</td>
                  <td className="num">{formatEuroNumber(g.p0, { use_abbreviation: true })}</td>
                  <td className="num">{formatEuroNumber(g.p0_15p5, { is_already_percent: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default NDTValidationView;

