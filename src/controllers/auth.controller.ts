import type { RequestHandler } from "express";
import User from "../models/User";
import {
  loginBodySchema,
  signupBodySchema,
} from "../validators/auth.validator";

export const signup: RequestHandler = async (req, res, next) => {
  const parsedBody = signupBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid signup data",
      errors: parsedBody.error.issues,
    });
    return;
  }

  const { username, phone, email, age, gender, healthGoals, password } =
    parsedBody.data;

  try {
    const existingUser = await User.findOne({ email }).select("_id");

    if (existingUser) {
      res.status(409).json({ message: "User with this email already exists" });
      return;
    }

    const createdUser = await User.create({
      username,
      phone,
      email,
      age,
      gender,
      healthGoals,
      passwordHash: password,
    });

    res.status(201).json({
      message: "User signup successful",
      userId: createdUser._id,
    });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (req, res, next) => {
  const parsedBody = loginBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid login data",
      errors: parsedBody.error.issues,
    });
    return;
  }

  const { email, password } = parsedBody.data;

  try {
    const user = await User.findOne({ email });

    if (!user || user.passwordHash !== password) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: "user",
    };

    res.status(200).json({
      message: "Login successful",
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};
