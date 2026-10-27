let path = require("path");
let { defineConfig } = require("vite");
let react = require("@vitejs/plugin-react");
let OrchestratorServer = require("./core/server/OrchestratorServer.js");

module.exports = defineConfig({
  plugins: [
    react(),
    OrchestratorServer.createVitePlugin()
  ],
  resolve: {
    alias: {
      "@opentui/core": path.resolve(__dirname, "core/framework/OpenTUIWrapper.jsx"),
      "@opentui/react": path.resolve(__dirname, "core/framework/OpenTUIWrapper.jsx"),
      "@velkscala/framework": path.resolve(__dirname, "core/framework/index_ui.js")
    }
  },
  server: {
    host: "127.0.0.1",
    port: 16000,
    strictPort: true
  }
});
