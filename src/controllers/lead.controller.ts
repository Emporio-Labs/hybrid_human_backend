import type { RequestHandler } from "express";
import mongoose from "mongoose";
import Lead from "../models/Lead";
import User from "../models/User";
import { LeadStatus } from "../models/Enums";
import { hashPassword } from "../utils/password";
import {
  convertLeadBodySchema,
  createLeadBodySchema,
  updateLeadBodySchema,
} from "../validators/lead.validator";

const parseDateOrNull = (value: string | undefined) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getIdParam = (idParam: string | string[] | undefined): string | null => {
  if (typeof idParam !== "string" || !mongoose.Types.ObjectId.isValid(idParam)) {
    return null;
  }

  return idParam;
};

export const createLead: RequestHandler = async (req, res, next) => {
  const parsedBody = createLeadBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead payload",
      errors: parsedBody.error.issues,
    });
    return;
  }

  const { ownerId, ...leadData } = parsedBody.data;

  const followUpDateValue = parseDateOrNull(parsedBody.data.followUpDate);

  if (parsedBody.data.followUpDate && !followUpDateValue) {
    res.status(400).json({ message: "Invalid followUpDate" });
    return;
  }

  if (ownerId && !mongoose.Types.ObjectId.isValid(ownerId)) {
    res.status(400).json({ message: "Invalid ownerId" });
    return;
  }

  try {
    const lead = await Lead.create({
      ...leadData,
      ...(followUpDateValue ? { followUpDate: followUpDateValue } : {}),
      ...(ownerId ? { owner: ownerId } : {}),
    });

    res.status(201).json({ message: "Lead created", lead });
  } catch (error) {
    next(error);
  }
};

export const getAllLeads: RequestHandler = async (_req, res, next) => {
  try {
    const leads = await Lead.find();
    res.status(200).json({ leads });
  } catch (error) {
    next(error);
  }
};

export const getLeadById: RequestHandler = async (req, res, next) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }

  try {
    const lead = await Lead.findById(id);

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.status(200).json({ lead });
  } catch (error) {
    next(error);
  }
};

export const updateLeadById: RequestHandler = async (req, res, next) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }

  const parsedBody = updateLeadBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead update payload",
      errors: parsedBody.error.issues,
    });
    return;
  }

  const { ownerId, ...payload } = parsedBody.data;

  const followUpDateValue = parseDateOrNull(parsedBody.data.followUpDate);

  if (parsedBody.data.followUpDate && !followUpDateValue) {
    res.status(400).json({ message: "Invalid followUpDate" });
    return;
  }

  if (ownerId && !mongoose.Types.ObjectId.isValid(ownerId)) {
    res.status(400).json({ message: "Invalid ownerId" });
    return;
  }

  try {
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      {
        ...payload,
        ...(followUpDateValue !== null ? { followUpDate: followUpDateValue } : {}),
        ...(ownerId ? { owner: ownerId } : {}),
      },
      { returnDocument: "after", runValidators: true },
    );

    if (!updatedLead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.status(200).json({ message: "Lead updated", lead: updatedLead });
  } catch (error) {
    next(error);
  }
};

export const deleteLeadById: RequestHandler = async (req, res, next) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }

  try {
    const deletedLead = await Lead.findByIdAndDelete(id);

    if (!deletedLead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    res.status(200).json({ message: "Lead deleted" });
  } catch (error) {
    next(error);
  }
};

export const convertLeadToUser: RequestHandler = async (req, res, next) => {
  const id = getIdParam(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid lead id" });
    return;
  }

  const parsedBody = convertLeadBodySchema.safeParse(req.body);

  if (!parsedBody.success) {
    res.status(400).json({
      message: "Invalid lead conversion payload",
      errors: parsedBody.error.issues,
    });
    return;
  }

  try {
    const lead = await Lead.findById(id);

    if (!lead) {
      res.status(404).json({ message: "Lead not found" });
      return;
    }

    if (lead.status === LeadStatus.Converted && lead.convertedUser) {
      res.status(409).json({
        message: "Lead already converted",
        userId: lead.convertedUser,
      });
      return;
    }

    const existingUser = await User.findOne({ email: lead.email });

    if (existingUser) {
      lead.status = LeadStatus.Converted;
      lead.convertedUser = existingUser._id;
      await lead.save();

      res.status(200).json({
        message: "Lead linked to existing user",
        lead,
        userId: existingUser._id,
      });
      return;
    }

    const { username, phone, age, gender, healthGoals, password } =
      parsedBody.data;
    const passwordHash = await hashPassword(password);

    const createdUser = await User.create({
      username: username ?? lead.leadName,
      phone,
      email: lead.email,
      age,
      gender,
      healthGoals,
      passwordHash,
    });

    lead.status = LeadStatus.Converted;
    lead.convertedUser = createdUser._id;
    await lead.save();

    res.status(201).json({
      message: "Lead converted to user",
      lead,
      user: {
        id: createdUser._id,
        email: createdUser.email,
        role: "user" as const,
      },
    });
  } catch (error) {
    next(error);
  }
};
