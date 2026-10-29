#!/usr/bin/env node
/**
 * Placement OS - Super Admin Credentials Reset CLI Utility
 * Usage: node scripts/reset-admin-credentials.mjs <new-email> <new-password>
 * Example: node scripts/reset-admin-credentials.mjs admin@mycompany.com NewPassword@123
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const newEmail = process.argv[2]?.trim().toLowerCase();
const newPassword = process.argv[3]?.trim();

if (!newEmail || !newPassword) {
  console.log("\n=======================================================");
  console.log("Placement OS — Super Admin Credentials Reset Tool");
  console.log("=======================================================\n");
  console.log("Usage: node scripts/reset-admin-credentials.mjs <new-email> <new-password>\n");
  console.log("Example:");
  console.log("  node scripts/reset-admin-credentials.mjs myadmin@example.com MyNewSecret@123\n");
  process.exit(1);
}

// Validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(newEmail)) {
  console.error("Error: Please provide a valid email address.");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("Error: Password must be at least 8 characters long.");
  process.exit(1);
}

const rawUri = process.env.MONGODB_URI?.trim();
const uri = rawUri
  ? (rawUri.startsWith('"') && rawUri.endsWith('"')) || (rawUri.startsWith("'") && rawUri.endsWith("'"))
    ? rawUri.slice(1, -1).trim()
    : rawUri
  : "";

if (!uri) {
  console.error("\n[Error] MONGODB_URI is not set in your environment or .env file.");
  console.error("To update credentials in MongoDB Atlas, set MONGODB_URI in .env.");
  console.error("Alternatively, log into the Admin Console via your private secret URL and click 'Change Credentials' in the header.\n");
  process.exit(1);
}

async function run() {
  try {
    console.log("[MongoDB] Connecting to database...");
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });
    console.log("[MongoDB] Connected successfully.");

    const db = mongoose.connection.db;
    const usersCollection = db.collection("users");

    // Find admin user
    const adminUser = await usersCollection.findOne({ role: "admin" });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();

    if (adminUser) {
      await usersCollection.updateOne(
        { _id: adminUser._id },
        {
          $set: {
            email: newEmail,
            passwordHash,
            updatedAt: now,
          },
        }
      );
      console.log("\n[SUCCESS] Super Admin credentials updated successfully!");
      console.log(`- New Admin Email (User ID): ${newEmail}`);
      console.log(`- Password: [Updated to new bcrypt hash]`);
      console.log(`- Admin Document ID: ${adminUser.id || adminUser._id}`);
    } else {
      // Create fresh root admin
      const newAdminDoc = {
        id: "admin-platform-root",
        email: newEmail,
        passwordHash,
        fullName: "Placement OS Operations Admin",
        role: "admin",
        verificationStatus: "verified",
        phone: "+91 9999900000",
        designation: "Platform Verification Director",
        college: "Placement OS Headquarters",
        course: "Administration",
        branch: "Operations",
        semester: 1,
        cgpa: 10,
        backlogs: 0,
        skills: ["Verification", "Compliance", "Security Review"],
        targetRoles: ["Platform Administrator"],
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
      };
      await usersCollection.insertOne(newAdminDoc);
      console.log("\n[SUCCESS] Created new Super Admin account!");
      console.log(`- Admin Email (User ID): ${newEmail}`);
    }

    console.log("\nYou can now log in at your private Super Admin URL with your new credentials.\n");
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("[Error] Failed to update credentials:", err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

run();
