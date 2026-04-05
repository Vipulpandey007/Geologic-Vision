const { createClient } = require("@supabase/supabase-js");

// Debug — print config on startup (remove after fixing)
console.log("=== SUPABASE CONFIG ===");
console.log("URL:", process.env.SUPABASE_URL);
console.log("BUCKET:", process.env.SUPABASE_BUCKET);
console.log(
  "KEY (first 20 chars):",
  process.env.SUPABASE_SERVICE_KEY?.slice(0, 20),
);
console.log("======================");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

const BUCKET = process.env.SUPABASE_BUCKET || "pdfs";
const SIGNED_URL_EXPIRY =
  parseInt(process.env.SUPABASE_SIGNED_URL_EXPIRY) || 300;

/**
 * List all buckets — call this once to verify connection
 */
async function listBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("❌ Cannot list buckets:", error.message);
  } else {
    console.log(
      "✅ Available buckets:",
      data.map((b) => b.name),
    );
  }
}
listBuckets(); // runs on server start

/**
 * Upload a file buffer to Supabase Storage
 */
async function uploadToSupabase(buffer, fileName, mimeType) {
  const { v4: uuidv4 } = require("uuid");
  const path = require("path");
  const ext = path.extname(fileName);
  const fileKey = `pdfs/${uuidv4()}${ext}`;

  console.log(`Uploading to bucket: "${BUCKET}", key: "${fileKey}"`);

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(fileKey, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    console.error("Upload error details:", JSON.stringify(error));
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  console.log("✅ Upload success:", data);
  return fileKey;
}

/**
 * Generate a signed URL
 */
async function generateSignedUrl(fileKey) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(fileKey, SIGNED_URL_EXPIRY);

  if (error) throw new Error(`Failed to generate signed URL: ${error.message}`);
  return data.signedUrl;
}

/**
 * Delete a file
 */
async function deleteFromSupabase(fileKey) {
  const { error } = await supabase.storage.from(BUCKET).remove([fileKey]);

  if (error) console.error("Supabase delete failed:", error.message);
}

module.exports = {
  supabase,
  uploadToSupabase,
  generateSignedUrl,
  deleteFromSupabase,
};
