import { MemberRepository, InvitationRepository } from "../repositories/MemberRepository";
import { OrganizationRepository } from "../repositories/OrganizationRepository";
import { UserRepository } from "../repositories/UserRepository";
import { sendInvitationEmail } from "./email";
import logger from "../logger";
import { hashPassword } from "better-auth/crypto";
import { db } from "../db/connection";
import { accounts } from "../db/schema";

const DASHBOARD_URL = process.env.DASHBOARD_URL || "http://localhost:3001";

export const MemberService = {
  getByOrganization: async (userId: string, organizationId: string) => {
    const requester = await MemberRepository.findMemberByOrgAndUser(organizationId, userId);
    if (!requester) {
      throw new Error("Not a member of this organization");
    }

    const members = await MemberRepository.findByOrganizationId(organizationId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      createdAt: m.createdAt,
      user: { name: m.userName, email: m.userEmail },
    }));
  },

  invite: async (userId: string, organizationId: string, email: string) => {
    const member = await MemberRepository.findMemberByOrgAndUser(organizationId, userId);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    const organization = await OrganizationRepository.findById(organizationId);
    const inviter = await UserRepository.findById(userId);

    const inviteToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await InvitationRepository.create({
      id: crypto.randomUUID(),
      organizationId,
      email: email.toLowerCase(),
      role: "member",
      token: inviteToken,
      expiresAt,
      createdAt: new Date(),
    });

    const inviteUrl = `${DASHBOARD_URL}/invite/${inviteToken}`;

    const emailResult = await sendInvitationEmail({
      to: email.toLowerCase(),
      inviterName: inviter?.name || inviter?.email || "A team member",
      organizationName: organization?.name || "an organization",
      inviteUrl,
      expiresIn: "7 days",
    });

    if (!emailResult.success) {
      logger.warn("Failed to send invitation email, but invitation created", {
        email,
        error: emailResult.error,
      });
    }

    return {
      inviteUrl,
      inviteToken,
      emailSent: emailResult.success,
    };
  },

  inviteDirect: async (userId: string, organizationId: string, email: string) => {
    const member = await MemberRepository.findMemberByOrgAndUser(organizationId, userId);
    if (!member || (member.role !== "owner" && member.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    let existingUser = await UserRepository.findByEmail(email.toLowerCase());
    let tempPassword: string | null = null;

    if (!existingUser) {
      tempPassword = crypto.randomUUID().slice(0, 12);
      const hashedPassword = await hashPassword(tempPassword);
      
      const newUserId = crypto.randomUUID();
      await UserRepository.create({
        id: newUserId,
        name: email.split("@")[0],
        email: email.toLowerCase(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        userId: newUserId,
        accountId: newUserId,
        providerId: "credential",
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      existingUser = await UserRepository.findById(newUserId);
    }

    const existingMember = await MemberRepository.findMemberByOrgAndUser(organizationId, existingUser.id);
    if (existingMember) {
      throw new Error("User is already a member of this organization");
    }

    await MemberRepository.createMembership({
      id: crypto.randomUUID(),
      organizationId,
      userId: existingUser.id,
      role: "member",
      createdAt: new Date(),
    });

    return {
      success: true,
      message: tempPassword 
        ? `User ${email} added as member. Temp password: ${tempPassword}`
        : `User ${email} added as member`,
      userCreated: !!tempPassword,
      tempPassword: tempPassword,
    };
  },

  checkInvite: async (token: string) => {
    const invitation = await InvitationRepository.findByToken(token);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      throw new Error("Invitation expired");
    }

    return {
      valid: true,
      organizationId: invitation.organizationId,
      organizationName: invitation.organizationName,
      organizationSlug: invitation.organizationSlug,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  },

  acceptInvite: async (userId: string, token: string) => {
    const invitation = await InvitationRepository.findByTokenSimple(token);
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    if (new Date(invitation.expiresAt).getTime() < Date.now()) {
      throw new Error("Invitation expired");
    }

    await MemberRepository.createMembership({
      id: crypto.randomUUID(),
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
      createdAt: new Date(),
    });

    await InvitationRepository.delete(token);
    return { success: true };
  },

  remove: async (currentUserId: string, memberId: string) => {
    const member = await MemberRepository.findById(memberId);
    if (!member) {
      throw new Error("Member not found");
    }

    if (member.userId === currentUserId && member.role === "owner") {
      throw new Error("Cannot remove owner");
    }

    const requester = await MemberRepository.findMemberByOrgAndUser(
      member.organizationId,
      currentUserId
    );
    if (!requester || (requester.role !== "owner" && requester.role !== "admin")) {
      throw new Error("Unauthorized");
    }

    await MemberRepository.delete(memberId);
    return { success: true };
  },
};

