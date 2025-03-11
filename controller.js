import { sql } from "./db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const getUsers = async (req, res) => {
  try {
    const users = await sql`
            SELECT * FROM users
            ORDER BY created_at DESC
        `;
    console.log("fetched users: ", users);
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.log("Error in getUsers function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const createUser = async (req, res) => {
  const { first_name, last_name, email, password } = req.body;

  if (!first_name || !last_name || !email || !password) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  const existingUser = await sql`
    SELECT * FROM users WHERE email = ${email} LIMIT 1;
  `;
  
  if (existingUser.length > 0) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists." });
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

  try {
    const newUser = await sql`
        INSERT INTO users (first_name, last_name, email, password)
        VALUES (${first_name}, ${last_name}, ${email}, ${hashedPassword})
        RETURNING *
    `;

    console.log("new user added: ", newUser);
    res.status(201).json({ success: true, data: newUser[0] });
  } catch (error) {
    console.log("Error in createUser function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await sql`
        SELECT * FROM users WHERE id=${id}
    `;

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    console.log("Error in getUser function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, email, password } = req.body;

  try {
    let hashedPassword = null;

    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const updatedUser = await sql`
        UPDATE users
        SET first_name=${first_name}, last_name=${last_name}, email=${email}, password=COALESCE(${hashedPassword}, password)
        WHERE id=${id}
        RETURNING *
    `;
    if (updatedUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: updatedUser[0] });
  } catch (error) {
    console.log("Error in updateUser function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await sql`
        DELETE FROM users WHERE id=${id} RETURNING *
    `;

    if (deletedUser.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: deletedUser[0] });
  } catch (error) {
    console.log("Error in deleteUser function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await sql`
        SELECT * FROM users WHERE email = ${email} LIMIT 1;
    `;

    if (user.length === 0) {
      console.log("User not found");
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    const existingUser = user[0];

    const isPasswordValid = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true, // JavaScript cannot access this cookie (prevents XSS attacks)
      secure: process.env.NODE_ENV === "production", // Only secure in production
      sameSite: "strict", // Prevent CSRF attacks
      maxAge: 60 * 60 * 1000, // Cookie expires in 1 hour (optional)
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: {
        id: existingUser.id,
        email: existingUser.email,
        first_name: existingUser.first_name,
        last_name: existingUser.last_name,
      },
    });
  } catch (error) {
    console.log("Error in loginUser function", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Only secure in production
    sameSite: "strict",
  });

  return res
    .status(200)
    .json({ success: true, message: "Logged out successfully" });
};

export const accessProfile = async (req, res) => {
  try {
    const user = await sql`
        SELECT id, first_name, last_name, email FROM users WHERE id = ${req.user.id};
    `;

    if (user.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({ success: true, data: user[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
