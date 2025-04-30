import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// --- Configuration ---
const projectRoot = path.resolve(__dirname, "..") // Resolve project root relative to script location
const sourceModulesDir = path.join(projectRoot, "node_modules")
const targetVendorTypesDir = path.join(projectRoot, "vendor-types")

// List of packages and their type definition subdirectories (relative to package root in node_modules)
// Start with agent-kit, add more as needed
const packagesToCopy = [
  { name: "@inngest/agent-kit", typesSubDir: "dist" }, // Assuming types are in dist based on error messages
  // Add other packages here if needed, e.g.:
  // { name: 'inngest', typesSubDir: 'dist/...' },
  // { name: '@types/some-package', typesSubDir: '.' }, // For packages in @types
]

// --- Helper Functions ---
function ensureDirSync(dirPath) {
  try {
    fs.mkdirSync(dirPath, { recursive: true })
    // console.log(`Directory created or already exists: ${dirPath}`);
  } catch (_err) {
    if (_err.code !== "EEXIST") {
      // console.error(`Error creating directory ${dirPath}:`, _err)
      throw _err // Rethrow if it's not just "directory exists"
    }
  }
}

function copyTypes(packageName, typesSubDir) {
  const sourceDirName = packageName.startsWith("@")
    ? packageName
    : path.join(".", packageName)
  const sourcePackageDir = path.join(sourceModulesDir, sourceDirName)
  const sourceTypesDir = path.join(sourcePackageDir, typesSubDir)

  const targetPackageDir = path.join(targetVendorTypesDir, packageName)
  const targetTypesDir = path.join(targetPackageDir, typesSubDir) // Maintain subdirectory structure

  // console.log(`\nProcessing: ${packageName}`)
  // console.log(`  Source: ${sourceTypesDir}`)
  // console.log(`  Target: ${targetTypesDir}`)

  if (fs.existsSync(sourceTypesDir)) {
    ensureDirSync(path.dirname(targetTypesDir)) // Ensure parent directories exist
    try {
      fs.cpSync(sourceTypesDir, targetTypesDir, {
        recursive: true,
        force: true, // Overwrite existing files in target
        filter: src =>
          path.extname(src) === ".ts" || fs.statSync(src).isDirectory(), // Copy only .d.ts files and directories
      })
      // console.log(
      //   `  ✅ Successfully copied types for ${packageName} to ${targetTypesDir}`
      // )
    } catch (_err) {
      // console.error(`  ❌ Error copying types for ${packageName}:`, _err)
    }
  } else {
    // console.warn(`  ⚠️ Source directory not found, skipping: ${sourceTypesDir}`)
  }
}

// --- Main Execution ---
// console.log("Starting vendor type definition copy process...")
ensureDirSync(targetVendorTypesDir) // Ensure the main vendor-types directory exists

packagesToCopy.forEach(pkg => {
  copyTypes(pkg.name, pkg.typesSubDir)
})

// console.log("\nVendor type definition copy process finished.")

async function main() {
  const vendorDir = path.join(process.cwd(), "src", "vendor")
  const destDir = path.join(process.cwd(), "src", "types", "vendor")

  // console.log(`Source vendor directory: ${vendorDir}`)
  // console.log(`Destination types directory: ${destDir}`)
  // console.log("Scanning vendor directory...")

  try {
    const files = await fs.readdir(vendorDir)
    // ... existing code ...
  } catch (_copyError) {
    // console.error(`Error copying file ${sourcePath}:`, _copyError)
  }
}

main()
