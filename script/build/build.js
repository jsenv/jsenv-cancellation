import { buildProject, getBabelPluginMapForNode } from "@jsenv/core"
import * as jsenvConfig from "../../jsenv.config.js"

buildProject({
  ...jsenvConfig,
  buildDirectoryRelativeUrl: "./dist/commonjs/",
  format: "commonjs",
  entryPointMap: {
    "./main.node.js": "./jsenv_cancellation.cjs",
  },
  babelPluginMap: getBabelPluginMapForNode(),
  buildDirectoryClean: true,
})
