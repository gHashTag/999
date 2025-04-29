import fs from "fs/promises"
import path from "path"
import { glob } from "glob"

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const projectRoot = path.resolve(__dirname, "..")
const testsDir = path.join(projectRoot, "src", "__tests__")

async function migrateTests() {
  console.log(`Searching for test files in: ${testsDir}`)
  const testFiles = await glob("**/*.test.ts", {
    cwd: testsDir,
    absolute: true,
  })

  if (testFiles.length === 0) {
    console.log("No test files found.")
    return
  }

  console.log(`Found ${testFiles.length} test files. Starting migration...`)

  let modifiedCount = 0
  for (const filePath of testFiles) {
    try {
      let content = await fs.readFile(filePath, "utf-8")
      let originalContent = content

      // Replace bun:test import with bun:test
      // Handles different import styles (e.g., with/without specific members)
      content = content.replace(/from\s+['"]bun:test['"]/g, 'from "bun:test"')

      // Replace mock.* calls with mock.*
      // Uses word boundary (\b) to avoid replacing parts of other words like 'visible'
      content = content.replace(/\bvi\./g, "mock.")

      if (content !== originalContent) {
        await fs.writeFile(filePath, content, "utf-8")
        console.log(`Migrated: ${path.relative(projectRoot, filePath)}`)
        modifiedCount++
      } else {
        // console.log(`No changes needed: ${path.relative(projectRoot, filePath)}`);
      }
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
    }
  }

  console.log(`\nMigration complete. Modified ${modifiedCount} files.`)
}

migrateTests().catch(console.error)
