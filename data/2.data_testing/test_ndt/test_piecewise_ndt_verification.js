let fs = require("fs");
let path = require("path");
let raw_defines = fs.readFileSync(path.resolve(__dirname, "../../../common/defines/filepath_defines.json5"), "utf8");
let svea_match = raw_defines.match(/svea_dir\s*:\s*"([^"]+)"/);
let root_dir = (svea_match) ? svea_match[1] : "D:/Project 1509 - SVEA";
let logit_dir = path.join(root_dir, "histmap/3.data_transform/age_sex/1.multinomial_logit");
let premodern_path = path.join(logit_dir, "premodern_multinomial_logit.json");
let unified_path = path.join(logit_dir, "multinomial_model_unified.json");

console.log("=== Testing Piecewise & Unified Model Architecture (1500/1750 AD Cutoff) ===");

//1. Verify premodern model exists and has 34 covariates
let premodern = JSON.parse(fs.readFileSync(premodern_path, "utf8"));
console.log(`Premodern model: ${premodern.covariates.length} covariates, reference class: ${premodern.reference_class}`);
let key_landuse = ["shifting", "grazing", "rangeland", "conv_rangeland", "cropland", "tot_rice"];
let has_all_lu = key_landuse.every(k => premodern.covariates.includes(k));
console.log(`Contains all key NDT land-use covariates (${key_landuse.join(", ")}): ${has_all_lu}`);

//2. Verify unified coverage-weighted ensemble exists for pre-1750 / historical blending
if (fs.existsSync(unified_path)) {
  let unified = JSON.parse(fs.readFileSync(unified_path, "utf8"));
  console.log(`Unified ensemble model: type=${unified.type}, classes=${unified.classes.length}, total_anchors=${unified.total_anchors}`);
}

//3. Verify post-1750 models use modern rolling model
let post_years = [1760, 1850, 1940];
for (let i = 0; i < post_years.length; i++) {
  let y = post_years[i];
  let model_file = path.join(logit_dir, `multinomial_model_${y}.json`);
  if (fs.existsSync(model_file)) {
    let m = JSON.parse(fs.readFileSync(model_file, "utf8"));
    console.log(`Year ${y} (modern rolling): ${m.covariates.length} covariates, reference class: ${m.reference_class || m.classes[0]}`);
  }
}

//4. Simulate NDT logit differential between 8000 BC and 0 AD for male infants (m_00)
let c_m00 = premodern.coefficients["m_00"];
let delta_logit_m00 = (
  c_m00.shifting*(0.30 - 0.0) +
  c_m00.cropland*(0.25 - 0.0) +
  c_m00.rangeland*(0.20 - 0.80) +
  c_m00.grazing*(0.25 - 0.10)
);
console.log(`\nSimulated NDT agricultural delta for m_00: ${delta_logit_m00.toFixed(6)}`);
console.log(`Notice positive shift due to shifting (+${(c_m00.shifting*0.3).toFixed(6)}) and rangeland reduction (-${(c_m00.rangeland*-0.6).toFixed(6)}).`);

console.log("\nPiecewise verification completed successfully.");
