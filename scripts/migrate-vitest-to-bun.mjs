import fs from "fs"
import path from "path"

async function migrateTests() {
  const testsDir = path.join(process.cwd(), "src", "__tests__")
  // console.log(`Starting migration in: ${testsDir}`)

  const files = await findTestFiles(testsDir)
  // console.log(`Found ${files.length} test files.`)

  for (const filePath of files) {
    try {
      let originalContent = await fs.readFile(filePath, "utf-8")

      // Replace bun:test import with bun:test
      // Handles different import styles (e.g., with/without specific members)
      let content = originalContent.replace(/from\s+['"]bun:test['"]/g, 'from "bun:test"')

      // Replace mock.* calls with mock.*
      // Handles cases like mock.fn(), mock.spyOn(), mock.resetAllMocks()
      content = content.replace(/mock\./g, "mock.")

      // Add other replacements as needed based on common patterns
      // e.g., content = content.replace(/vi\.fn/g, "mock");

      if (content !== originalContent) {
        await fs.writeFile(filePath, content, "utf-8")
        // console.log(`  Updated: ${filePath}`)
      }
    } catch (_error) {
      console.error(`Error processing file ${filePath}:`, _error)
    }
  }

  // console.log("Migration attempt finished.")
}

// Helper function to recursively find .test.ts and .spec.ts files
async function findTestFiles(dir: string): Promise<string[]> {
  let results: string[] = []
  const list = await fs.readdir(dir)
  for (const file of list) {
    const filePath = path.join(dir, file)
    const stat = await fs.stat(filePath)
    if (stat && stat.isDirectory()) {
      results = results.concat(await findTestFiles(filePath))
    } else if (file.endsWith(".test.ts") || file.endsWith(".spec.ts")) {
      results.push(filePath)
    }
  }
  return results
}

migrateTests()


